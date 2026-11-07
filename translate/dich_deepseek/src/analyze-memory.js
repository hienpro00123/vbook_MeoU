load('prompts.js');
var ANALYSIS_API_BASE = "https://api.deepseek.com/chat/completions";
var ANALYSIS_MODEL = "deepseek-flash";
var ANALYSIS_TABLE = "translation_memory";
var ANALYSIS_MAX_CHAPTERS = 30;
var ANALYSIS_BLOCK_LENGTH = 24000;
var ANALYSIS_MAX_MEMORY_ROWS = 2000;
var ANALYSIS_MAX_CONTEXT_ROWS = 80;
var ANALYSIS_MAX_ENTITIES = 60;
var ANALYSIS_PROGRESS_PREFIX = "dich_deepseek_analysis_progress_";
var ANALYSIS_MAX_SCAN_ATTEMPTS = 120;
var ANALYSIS_PROGRESS_MAX_CHAPTERS = 500;

function execute(input) {
    var info;
    try {
        info = localBook.getInfo();
    } catch (e) {
        return Response.error("Không lấy được thông tin truyện: " + String(e));
    }
    if (!info || !info.id) {
        return Response.error("Action này chỉ dùng được khi mở cài đặt DeepSeek Translate từ một truyện");
    }

    var apiKeys = analysisReadApiKeys();
    if (apiKeys.length === 0) {
        return Response.error("Vui lòng thêm DeepSeek API key trong cài đặt extension");
    }

    var options = analysisParseInput(input);
    var progress = analysisLoadProgress(String(info.id));
    var collection;
    if (options.mode === "automatic") {
        var automaticText = analysisCleanContent(options.chapterText || "");
        var automaticPosition = parseInt(options.chapterPosition, 10);
        if (!automaticText || isNaN(automaticPosition) || automaticPosition < 0) {
            return Response.error("Không nhận được nội dung hoặc vị trí chương để phân tích tự động");
        }
        var automaticFingerprint = analysisFingerprint(automaticText);
        if (progress.chapters[String(automaticPosition)] === automaticFingerprint) {
            return Response.success("Chương này đã được phân tích, không cần gọi lại API");
        }
        collection = {
            chapters: [{
                position: automaticPosition,
                title: analysisOneLine(options.chapterTitle || ("Chương " + (automaticPosition + 1))),
                text: automaticText
            }],
            skipped: [],
            unavailable: [],
            pending: progress.pending || [],
            error: ""
        };
    } else {
        var chapterLimit = analysisReadInteger("memory_analysis_chapters", 5, 1, ANALYSIS_MAX_CHAPTERS);
        collection = analysisCollectChapters(info, chapterLimit, progress);
    }
    var chapters = collection.chapters;
    if (chapters.length === 0) {
        if (collection.error) {
            return Response.error("Không đọc được danh sách chương: " + collection.error);
        }
        if (collection.skipped.length > 0) {
            return Response.error("Không đọc được nội dung các chương tại vị trí: " + collection.skipped.join(", "));
        }
        if (collection.pending && collection.pending.length > 0) {
            return Response.error("Chưa có nội dung lưu cho các chương đang chờ: " + collection.pending.join(", "));
        }
        return Response.error("Không tìm thấy chương mới cần phân tích; bộ nhớ đã bắt kịp tiến độ");
    }

    var languages = translationRecalledLanguages(String(info.id));
    if (options.from) languages.from = String(options.from);
    if (options.to) languages.to = String(options.to);
    if (languages.from === "auto") {
        languages.from = translationDetectLanguage(chapters[0].text);
        if (!languages.from && translationIsChineseSource(chapters[0].text, "auto")) languages.from = "zh-CN";
    }
    if (!languages.from) languages.from = "auto";
    var memory;
    try {
        memory = analysisLoadMemory(String(info.id), languages);
    } catch (memoryError) {
        return Response.error("Không đọc được bộ nhớ dịch: " + String(memoryError));
    }
    var analyzedBlocks = 0;
    var changedRows = 0;

    for (var chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
        var chapter = chapters[chapterIndex];
        var blocks = analysisSplitContent(chapter.text, ANALYSIS_BLOCK_LENGTH);

        for (var blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
            var block = blocks[blockIndex];
            var result = analysisRequest(
                apiKeys,
                chapter,
                block,
                blockIndex,
                blocks.length,
                analysisBuildMemoryContext(memory, block),
                languages
            );
            if (result.error) {
                return Response.error(
                    "Phân tích dừng ở chương " + chapter.position +
                    " (phần " + (blockIndex + 1) + "/" + blocks.length + "): " + result.error
                );
            }

            try {
                changedRows += analysisMergeEntities(
                    String(info.id),
                    memory,
                    result.entities,
                    block,
                    chapter.position,
                    languages
                );
            } catch (saveError) {
                return Response.error(
                    "Không lưu được bộ nhớ dịch tại chương " + chapter.position +
                    " (phần " + (blockIndex + 1) + "/" + blocks.length + "): " + String(saveError)
                );
            }
            analyzedBlocks++;
        }

        try {
            analysisRecordProgress(String(info.id), progress, chapter);
        } catch (progressError) {
            return Response.error(
                "Đã phân tích chương " + chapter.position + " nhưng không lưu được tiến độ: " +
                String(progressError)
            );
        }
    }

    var message = "Đã phân tích " + chapters.length + " chương (" + analyzedBlocks +
        " phần), thực hiện " + changedRows + " lượt cập nhật bộ nhớ dịch";
    if (options.mode === "automatic") message = "Đã tự động cập nhật bộ nhớ tên và quan hệ từ chương " + chapters[0].position;
    if (collection.pending && collection.pending.length > 0) {
        message += ". Chương chưa lưu sẽ được thử lại: " + collection.pending.join(", ");
    }
    if (collection.skipped.length > 0) {
        message += ". Không đọc được chương tại vị trí: " + collection.skipped.join(", ");
    }
    if (collection.unavailable.length > 0) {
        message += ". Chưa có nội dung đã lưu tại vị trí: " + collection.unavailable.join(", ");
    }
    return Response.success(message);
}

function analysisCollectChapters(info, limit, progress) {
    var toc;
    try {
        toc = localBook.getTableOfContent();
    } catch (e) {
        return { chapters: [], skipped: [], unavailable: [], pending: [], error: String(e) };
    }
    if (!Array.isArray(toc) || toc.length === 0) {
        return { chapters: [], skipped: [], unavailable: [], pending: [], error: "" };
    }

    toc.sort(function (left, right) {
        return Number(left.position || 0) - Number(right.position || 0);
    });

    var startPosition = progress && progress.nextPosition !== null && progress.nextPosition !== undefined
        ? parseInt(progress.nextPosition, 10)
        : parseInt(info.lastReadChapterIndex, 10);
    if (isNaN(startPosition) || startPosition < 0) startPosition = 0;
    var collection = { chapters: [], skipped: [], unavailable: [], pending: [], error: "" };
    var seenPositions = {};
    var pending = Array.isArray(progress && progress.pending) ? progress.pending.slice(0) : [];
    var pendingSet = {};
    for (var pendingIndex = 0; pendingIndex < pending.length; pendingIndex++) {
        pendingSet[String(pending[pendingIndex])] = true;
    }

    for (var index = 0, attempts = 0;
        index < toc.length && collection.chapters.length < limit && attempts < ANALYSIS_MAX_SCAN_ATTEMPTS;
        index++) {
        var tocItem = toc[index];
        var position = Number(tocItem.position);
        if (isNaN(position)) continue;
        var isPending = pendingSet[String(position)] === true;
        if (position < startPosition && !isPending) continue;
        if (String(tocItem.id || "").indexOf("_section_") >= 0) continue;
        if (seenPositions[position]) continue;
        seenPositions[position] = true;
        attempts++;

        var content;
        try {
            content = localBook.getChapterContent(position);
        } catch (e2) {
            collection.skipped.push(position);
            collection.pending.push(position);
            continue;
        }
        if (!content || !content.content) {
            collection.unavailable.push(position);
            collection.pending.push(position);
            continue;
        }

        var raw = content.content.raw;
        if (raw === null || raw === undefined) raw = content.content[""];
        if (raw === null || raw === undefined || String(raw).trim() === "") {
            collection.unavailable.push(position);
            collection.pending.push(position);
            continue;
        }
        var cleaned = analysisCleanContent(String(raw));
        if (!cleaned) {
            collection.unavailable.push(position);
            collection.pending.push(position);
            continue;
        }

        if (progress.chapters[String(position)] === analysisFingerprint(cleaned)) {
            pendingSet[String(position)] = false;
            continue;
        }
        collection.chapters.push({
            position: position,
            title: analysisChapterTitle(tocItem.title, position),
            text: cleaned
        });
    }

    for (var oldPendingIndex = 0; oldPendingIndex < pending.length; oldPendingIndex++) {
        var oldPendingPosition = Number(pending[oldPendingIndex]);
        if (seenPositions[String(oldPendingPosition)] || isNaN(oldPendingPosition)) continue;
        collection.pending.push(oldPendingPosition);
    }

    var uniquePending = [];
    for (var collectedPendingIndex = 0; collectedPendingIndex < collection.pending.length; collectedPendingIndex++) {
        var pendingPosition = Number(collection.pending[collectedPendingIndex]);
        if (!isNaN(pendingPosition) && uniquePending.indexOf(pendingPosition) < 0) uniquePending.push(pendingPosition);
    }
    collection.pending = uniquePending;
    return collection;
}

function analysisChapterTitle(value, position) {
    if (value && value.raw) return String(value.raw);
    if (value && value[""]) return String(value[""]);
    if (value) {
        for (var key in value) {
            if (value.hasOwnProperty(key) && value[key]) return String(value[key]);
        }
    }
    return "Chương " + position;
}

function analysisCleanContent(value) {
    var text = String(value || "");
    if (/<[a-z][\s\S]*>/i.test(text)) {
        try {
            text = Html.parse(text).text();
        } catch (e) {}
    }
    return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function analysisSplitContent(text, maxLength) {
    var blocks = [];
    var remaining = String(text || "").trim();
    while (remaining.length > maxLength) {
        var cut = remaining.lastIndexOf("\n\n", maxLength);
        if (cut < Math.floor(maxLength * 0.6)) cut = remaining.lastIndexOf("\n", maxLength);
        if (cut < Math.floor(maxLength * 0.6)) cut = maxLength;
        blocks.push(remaining.substring(0, cut).trim());
        remaining = remaining.substring(cut).trim();
    }
    if (remaining) blocks.push(remaining);
    return blocks;
}

function analysisParseInput(input) {
    if (input && typeof input === "object") return input;
    var value = String(input || "").trim();
    if (!value) return {};
    try {
        var parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        return {};
    }
}

function analysisLoadProgress(bookId) {
    var state = { nextPosition: null, chapters: {}, pending: [] };
    try {
        var raw = localStorage.getItem(ANALYSIS_PROGRESS_PREFIX + bookId);
        if (!raw) return state;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return state;
        var nextPosition = parseInt(parsed.nextPosition, 10);
        if (!isNaN(nextPosition) && nextPosition >= 0) state.nextPosition = nextPosition;
        if (parsed.chapters && typeof parsed.chapters === "object") state.chapters = parsed.chapters;
        if (Array.isArray(parsed.pending)) state.pending = parsed.pending;
    } catch (e) {
        Log.log("[DeepSeek Memory Analysis] Cannot read analysis progress: " + e);
    }
    return state;
}

function analysisSaveProgress(bookId, state) {
    localStorage.setItem(ANALYSIS_PROGRESS_PREFIX + bookId, JSON.stringify(state));
}

function analysisRecordProgress(bookId, state, chapter) {
    var position = Number(chapter.position);
    state.chapters[String(position)] = analysisFingerprint(chapter.text);
    if (state.nextPosition === null || position >= Number(state.nextPosition)) {
        state.nextPosition = position + 1;
    }
    state.pending = Array.isArray(state.pending) ? state.pending : [];
    var pending = [];
    for (var index = 0; index < state.pending.length; index++) {
        if (Number(state.pending[index]) !== position) pending.push(Number(state.pending[index]));
    }
    state.pending = pending;

    var positions = Object.keys(state.chapters).sort(function (left, right) {
        return Number(left) - Number(right);
    });
    while (positions.length > ANALYSIS_PROGRESS_MAX_CHAPTERS) {
        delete state.chapters[positions.shift()];
    }
    analysisSaveProgress(bookId, state);
}

function analysisFingerprint(text) {
    var value = String(text || "");
    var first = 1;
    var second = 0;
    for (var index = 0; index < value.length; index++) {
        first = (first + value.charCodeAt(index)) % 65521;
        second = (second + first) % 65521;
    }
    return value.length + "-" + second + "-" + first;
}

function analysisRequest(apiKeys, chapter, text, blockIndex, blockCount, memoryContext, languages) {
    var sourceName = translationLanguageName(languages.from);
    var targetName = translationLanguageName(languages.to);
    var instruction = "Bạn là biên tập viên phân tích truyện để xây dựng bộ nhớ dịch bền vững từ " +
        sourceName + " sang " + targetName + ". " +
        "Chỉ trích xuất thông tin có độ tin cậy cao từ đoạn được cung cấp; không dịch toàn chương và không suy đoán khi thiếu bằng chứng. " +
        "Tên/cách dịch đã có trong BỘ NHỚ HIỆN TẠI là chuẩn bắt buộc, không tự đổi. " +
        "Phân biệt nhân vật trùng họ, gộp biệt danh vào đúng nhân vật, và ghi quan hệ theo góc nhìn của nhân vật đang xét. " +
        "Xưng hô chỉ ghi khi lời thoại hoặc vai vế cho thấy rõ. " +
        "Đối chiếu BỘ NHỚ HIỆN TẠI với đoạn mới: chỉ cập nhật khi có bằng chứng; nhận diện biệt danh mới và thay đổi quan hệ theo diễn biến, không coi trạng thái cũ là vĩnh viễn. " +
        "Với quan hệ, ghi status là current, past hoặc uncertain, confidence từ 0 đến 1 và evidence ngắn dựa trên đoạn. " +
        "Trả về duy nhất một JSON hợp lệ, không Markdown, dạng: " +
        '{"entities":[{"source":"tên hoặc thuật ngữ đúng như nguyên văn","target":"cách dịch ổn định sang ngôn ngữ đích",' +
        '"kind":"character|place|organization|term","aliases":["biệt danh đúng như nguyên văn"],' +
        '"gender":"male|female|unknown","role":"vai trò ngắn gọn",' +
        '"relationships":[{"with":"tên nguyên văn của người kia","type":"quan hệ",' +
        '"addressTo":"nhân vật này gọi người kia","addressFrom":"người kia gọi nhân vật này",' +
        '"status":"current|past|uncertain","confidence":0.0,"evidence":"bằng chứng ngắn trong đoạn"}],' +
        '"note":"ghi chú ngắn cần cho các chương sau"}]}. ' +
        "source và aliases phải là tên riêng hoặc thuật ngữ đáng ghi nhớ, xuất hiện nguyên văn trong đoạn hoặc đã có trong bộ nhớ. " +
        "target phải dùng " + targetName + ". Nếu quan hệ thay đổi, hãy ghi trạng thái mới và bằng chứng; không bịa mốc thời gian. " +
        "Không lấy đại từ, từ thông thường, câu dài, dữ liệu mơ hồ; tối đa " +
        ANALYSIS_MAX_ENTITIES + " mục.";

    var userText = "CHƯƠNG: " + chapter.title + " (vị trí " + chapter.position +
        ", phần " + (blockIndex + 1) + "/" + blockCount + ")";
    if (memoryContext) userText += "\n\nBỘ NHỚ HIỆN TẠI:\n" + memoryContext;
    userText += "\n\nNỘI DUNG CẦN PHÂN TÍCH:\n" + text;

    var request = {
        model: ANALYSIS_MODEL,
        messages: [
            { role: "system", content: instruction },
            { role: "user", content: userText }
        ],
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: "json_object" }
    };
    var requestBody = JSON.stringify(request);
    var endpoint = ANALYSIS_API_BASE;
    var lastError = "";

    for (var keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
        var response;
        try {
            response = fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKeys[keyIndex]
                },
                body: requestBody,
                timeout: 120000
            });
        } catch (e) {
            lastError = String(e);
            analysisLog(
                "chapter=" + chapter.position +
                " part=" + (blockIndex + 1) + "/" + blockCount +
                " requestError=" + lastError
            );
            continue;
        }

        if (!response.ok) {
            lastError = analysisApiError(response);
            analysisLog(
                "chapter=" + chapter.position +
                " part=" + (blockIndex + 1) + "/" + blockCount +
                " httpError=" + lastError
            );
            if (response.status === 401 || response.status === 403 || response.status === 429) continue;
            return { entities: [], error: lastError };
        }

        var responseText = response.text();
        var data;
        try {
            data = JSON.parse(responseText);
        } catch (e2) {
            analysisLog("chapter=" + chapter.position + " invalidResponseJson=" + String(e2));
            return { entities: [], error: "DeepSeek trả về dữ liệu không hợp lệ" };
        }
        var finishReason = data && data.choices && data.choices.length > 0 && data.choices[0]
            ? String(data.choices[0].finish_reason || "")
            : "";
        if (!finishReason) {
            return { entities: [], error: "DeepSeek không xác nhận trạng thái hoàn tất phân tích" };
        }
        if (finishReason === "length") {
            return { entities: [], error: "DeepSeek đã cắt kết quả phân tích do chạm giới hạn token đầu ra" };
        }
        if (finishReason && finishReason !== "stop") {
            return { entities: [], error: "DeepSeek không thể hoàn tất phân tích: " + finishReason };
        }
        var parsed = analysisParseEntities(analysisExtractText(data));
        if (parsed.error) {
            analysisLog("chapter=" + chapter.position + " parseError=" + parsed.error);
            return parsed;
        }
        return parsed;
    }
    return { entities: [], error: lastError || "Không có DeepSeek API key khả dụng" };
}

function analysisParseEntities(value) {
    var text = analysisStripFence(value);
    var data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        var objectMatch = text.match(/\{[\s\S]*\}/);
        try {
            data = objectMatch ? JSON.parse(objectMatch[0]) : null;
        } catch (e2) {
            data = null;
        }
    }
    var entities = null;
    if (Array.isArray(data)) {
        entities = data;
    } else if (data && Array.isArray(data.entities)) {
        entities = data.entities;
    } else if (data && Array.isArray(data.items)) {
        entities = data.items;
    } else if (data && data.result && Array.isArray(data.result.entities)) {
        entities = data.result.entities;
    } else if (data && data.data && Array.isArray(data.data.entities)) {
        entities = data.data.entities;
    }
    if (!entities && data && typeof data === "object") {
        var discovered = [];
        for (var key in data) {
            if (!data.hasOwnProperty(key) || !Array.isArray(data[key])) continue;
            for (var itemIndex = 0; itemIndex < data[key].length; itemIndex++) {
                var item = data[key][itemIndex];
                if (item && (item.source || item.target)) discovered.push(item);
            }
        }
        if (discovered.length > 0) entities = discovered;
        else return { entities: [], error: "DeepSeek trả về JSON không có danh sách thực thể" };
    }
    if (!entities) return { entities: [], error: "DeepSeek trả về JSON không thể phân tích" };
    return { entities: entities.slice(0, ANALYSIS_MAX_ENTITIES), error: "" };
}

function analysisLoadMemory(bookId, languages) {
    var memory = {};
    var total = localDatabase.count(bookId, ANALYSIS_TABLE);
    var rows;
    if (total > ANALYSIS_MAX_MEMORY_ROWS) {
        var half = Math.floor(ANALYSIS_MAX_MEMORY_ROWS / 2);
        rows = localDatabase.list(bookId, ANALYSIS_TABLE, 0, half);
        var recentRows = localDatabase.list(
            bookId,
            ANALYSIS_TABLE,
            Math.max(0, total - half),
            half
        );
        for (var recentIndex = 0; recentRows && recentIndex < recentRows.length; recentIndex++) {
            rows.push(recentRows[recentIndex]);
        }
    } else {
        rows = localDatabase.list(bookId, ANALYSIS_TABLE, 0, Math.min(total, ANALYSIS_MAX_MEMORY_ROWS));
    }
    for (var index = 0; rows && index < rows.length; index++) {
        var key = analysisOneLine(rows[index].key);
        if (!key) continue;
        var value = analysisParseMemoryValue(rows[index].value);
        if (translationMemoryPairMatches(value, languages.from, languages.to)) memory[key] = value;
    }
    return memory;
}

function analysisParseMemoryValue(value) {
    var raw = String(value || "");
    try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.target) return parsed;
    } catch (e) {}
    return { target: raw, kind: "term", note: "", aliases: [], relationships: [], chapters: [] };
}

function analysisBuildMemoryContext(memory, text) {
    var lines = [];
    for (var source in memory) {
        if (!memory.hasOwnProperty(source)) continue;
        var data = memory[source] || {};
        var aliases = Array.isArray(data.aliases) ? data.aliases : [];
        var matched = translationTermInText(text, source);
        for (var aliasIndex = 0; !matched && aliasIndex < aliases.length; aliasIndex++) {
            if (translationTermInText(text, String(aliases[aliasIndex]))) matched = true;
        }
        if (!matched) continue;

        var line = "- " + source;
        if (aliases.length > 0) line += " (còn gọi: " + aliases.join(", ") + ")";
        line += " => " + String(data.target || "") + " [" + String(data.kind || "term") + "]";
        var details = [];
        if (data.gender && data.gender !== "unknown") details.push("giới tính " + data.gender);
        if (data.role) details.push(String(data.role));
        if (data.note) details.push(String(data.note));
        if (data.autoNote) details.push(String(data.autoNote));
        if (Array.isArray(data.relationships)) {
            for (var relationshipIndex = 0; relationshipIndex < data.relationships.length; relationshipIndex++) {
                var relationship = data.relationships[relationshipIndex];
                if (!relationship || !relationship.with || !relationship.type) continue;
                var relationshipText = relationship.with + ": " + relationship.type +
                    " (" + String(relationship.status || "current") + ")";
                if (relationship.addressTo) relationshipText += ", gọi " + relationship.addressTo;
                if (relationship.addressFrom) relationshipText += ", được gọi " + relationship.addressFrom;
                if (relationship.evidence) relationshipText += ", bằng chứng: " + relationship.evidence;
                details.push(relationshipText);
            }
        }
        if (details.length > 0) line += " — " + details.join("; ");
        lines.push(line);
        if (lines.length >= ANALYSIS_MAX_CONTEXT_ROWS) break;
    }
    return lines.join("\n");
}

function analysisMergeEntities(bookId, memory, entities, text, position, languages) {
    if (!Array.isArray(entities) || entities.length === 0) return 0;
    var records = [];
    var touched = {};

    for (var index = 0; index < entities.length; index++) {
        var entity = entities[index];
        if (!entity) continue;
        var source = analysisOneLine(entity.source);
        var target = analysisOneLine(entity.target);
        if (!source || !target || !analysisValidSourceTerm(source, target, text, languages.from, true)) continue;

        var canonical = analysisFindCanonical(memory, source);
        if (!canonical) canonical = source;
        if (touched[canonical]) continue;

        var old = memory[canonical] || {};
        var merged = {};
        merged.target = analysisOneLine(old.target) || target;
        merged.kind = analysisNormalizeKind(old.kind || entity.kind);
        merged.note = analysisOneLine(old.note || "");
        merged.aliases = analysisMergeAliases(old.aliases, entity.aliases, canonical, text, languages.from);
        if (source !== canonical && merged.aliases.indexOf(source) < 0) merged.aliases.push(source);
        merged.gender = analysisMergeSingle(old.gender, entity.gender, "unknown");
        merged.role = analysisMergeText(old.role, entity.role, 400);
        merged.relationships = analysisMergeRelationships(old.relationships, entity.relationships, memory, position);
        merged.autoNote = analysisMergeText(old.autoNote, entity.note, 500);
        merged.chapters = analysisMergeChapters(old.chapters, position);
        merged.firstSeenChapter = old.firstSeenChapter === undefined ? position : old.firstSeenChapter;
        merged.lastSeenChapter = position;
        merged.from = languages.from;
        merged.to = languages.to;
        merged.updatedAt = Date.now();

        memory[canonical] = merged;
        records.push({ key: canonical, value: JSON.stringify(merged) });
        touched[canonical] = true;
    }

    if (records.length === 0) return 0;
    return Number(localDatabase.upsertAll(bookId, ANALYSIS_TABLE, records)) || 0;
}

function analysisFindCanonical(memory, source) {
    if (memory[source]) return source;
    for (var key in memory) {
        if (!memory.hasOwnProperty(key)) continue;
        var aliases = memory[key] && Array.isArray(memory[key].aliases) ? memory[key].aliases : [];
        for (var index = 0; index < aliases.length; index++) {
            if (String(aliases[index]) === source) return key;
        }
    }
    return "";
}

function analysisMergeAliases(oldAliases, newAliases, source, text, from) {
    var result = [];
    var lists = [Array.isArray(oldAliases) ? oldAliases : [], Array.isArray(newAliases) ? newAliases : []];
    for (var listIndex = 0; listIndex < lists.length; listIndex++) {
        for (var index = 0; index < lists[listIndex].length; index++) {
            var alias = analysisOneLine(lists[listIndex][index]);
            if (!alias || alias === source || !analysisValidSourceTerm(alias, "_", text, from, listIndex === 1)) continue;
            if (result.indexOf(alias) < 0) result.push(alias);
            if (result.length >= 20) return result;
        }
    }
    return result;
}

function analysisMergeRelationships(oldRelationships, newRelationships, memory, position) {
    var result = [];
    var existing = Array.isArray(oldRelationships) ? oldRelationships : [];
    var incoming = Array.isArray(newRelationships) ? newRelationships : [];
    for (var index = 0; index < existing.length; index++) {
        var oldItem = existing[index];
        if (!oldItem || !oldItem.with || !oldItem.type) continue;
        result.push(analysisNormalizeRelationship(oldItem, memory, position));
    }

    for (var itemIndex = 0; itemIndex < incoming.length; itemIndex++) {
        var newItem = incoming[itemIndex];
        if (!newItem) continue;
        var normalized = analysisNormalizeRelationship(newItem, memory, position);
        if (!normalized.with || !normalized.type) continue;
        var currentIndex = -1;
        for (var current = 0; current < result.length; current++) {
            if (result[current].with.toLowerCase() === normalized.with.toLowerCase()) {
                currentIndex = current;
                break;
            }
        }

        if (currentIndex < 0) {
            result.push(normalized);
        } else {
            var previous = result[currentIndex];
            var sameState = previous.type === normalized.type &&
                previous.status === normalized.status &&
                previous.addressTo === normalized.addressTo &&
                previous.addressFrom === normalized.addressFrom;
            if (sameState) {
                previous.lastSeenChapter = position;
                previous.confidence = Math.max(previous.confidence, normalized.confidence);
                if (normalized.evidence) previous.evidence = normalized.evidence;
            } else if (normalized.confidence >= previous.confidence) {
                var history = Array.isArray(previous.history) ? previous.history.slice(0) : [];
                history.push({
                    type: previous.type,
                    status: previous.status,
                    addressTo: previous.addressTo,
                    addressFrom: previous.addressFrom,
                    confidence: previous.confidence,
                    evidence: previous.evidence,
                    lastSeenChapter: previous.lastSeenChapter
                });
                if (history.length > 8) history = history.slice(history.length - 8);
                normalized.history = history;
                normalized.firstSeenChapter = previous.firstSeenChapter;
                normalized.lastSeenChapter = position;
                result[currentIndex] = normalized;
            }
        }
        if (result.length >= 40) return result;
    }
    return result;
}

function analysisNormalizeRelationship(item, memory, position) {
    var withName = analysisOneLine(item.with);
    var canonical = memory ? analysisFindCanonical(memory, withName) : "";
    var confidence = parseFloat(item.confidence);
    if (isNaN(confidence)) confidence = 0.65;
    if (confidence < 0) confidence = 0;
    if (confidence > 1) confidence = 1;
    var status = String(item.status || "current").toLowerCase();
    if (status !== "past" && status !== "uncertain") status = "current";
    return {
        with: canonical || withName,
        type: analysisOneLine(item.type),
        addressTo: analysisOneLine(item.addressTo || ""),
        addressFrom: analysisOneLine(item.addressFrom || ""),
        status: status,
        confidence: confidence,
        evidence: analysisOneLine(item.evidence || "").substring(0, 240),
        firstSeenChapter: item.firstSeenChapter === undefined ? position : item.firstSeenChapter,
        lastSeenChapter: item.lastSeenChapter === undefined ? position : item.lastSeenChapter,
        history: Array.isArray(item.history) ? item.history.slice(0, 8) : []
    };
}

function analysisMergeChapters(oldChapters, position) {
    var result = Array.isArray(oldChapters) ? oldChapters.slice(0) : [];
    if (result.indexOf(position) < 0) result.push(position);
    if (result.length > 30) result = result.slice(result.length - 30);
    return result;
}

function analysisMergeSingle(oldValue, newValue, fallback) {
    var oldText = analysisOneLine(oldValue || "");
    var newText = analysisOneLine(newValue || "");
    if (oldText && oldText !== fallback) return oldText;
    return newText || oldText || fallback;
}

function analysisMergeText(oldValue, newValue, maxLength) {
    var oldText = analysisOneLine(oldValue || "");
    var newText = analysisOneLine(newValue || "");
    if (!oldText) return newText.substring(0, maxLength);
    if (!newText || oldText.indexOf(newText) >= 0) return oldText.substring(0, maxLength);
    return (oldText + "; " + newText).substring(0, maxLength);
}

function analysisNormalizeKind(value) {
    var kind = String(value || "term").toLowerCase();
    if (kind === "character" || kind === "place" || kind === "organization" || kind === "term") return kind;
    return "term";
}

function analysisReadApiKeys() {
    var raw = analysisReadConfig("api_key", "").trim();
    if (!raw) return [];
    var values;
    try {
        values = JSON.parse(raw);
    } catch (e) {
        values = raw.split("\n");
    }
    if (!Array.isArray(values)) values = [String(values)];
    var keys = [];
    for (var index = 0; index < values.length; index++) {
        var key = String(values[index] || "").trim();
        if (key && keys.indexOf(key) < 0) keys.push(key);
    }
    return keys;
}

function analysisReadConfig(key, fallback) {
    var value = localConfig.getItem(translationConfigKey(key));
    return value === null || value === undefined || value === "" ? fallback : String(value);
}

function analysisReadInteger(key, fallback, min, max) {
    var value = parseInt(analysisReadConfig(key, String(fallback)), 10);
    if (isNaN(value)) value = fallback;
    if (value < min) value = min;
    if (value > max) value = max;
    return value;
}

function analysisExtractText(data) {
    if (!data || !data.choices || data.choices.length === 0) return "";
    var message = data.choices[0].message;
    if (!message || !message.content) return "";
    return String(message.content);
}

function analysisApiError(response) {
    var text = response.text();
    var data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = null;
    }
    var message = data && data.error && data.error.message ? String(data.error.message) : "";
    return "DeepSeek HTTP " + response.status + (message ? ": " + message : "");
}

function analysisStripFence(value) {
    var text = String(value || "").trim();
    var match = text.match(/^```[^\n]*\n([\s\S]*?)\n```$/);
    return match ? match[1] : text;
}

function analysisContainsChinese(value) {
    return /[\u3400-\u9fff\uf900-\ufaff]/.test(String(value || ""));
}

function analysisValidSourceTerm(source, target, text, from, requireMatch) {
    var value = String(source || "");
    if (!value) return false;
    if (target && value === String(target)) return false;
    if (requireMatch && !translationTermInText(text, value)) return false;
    if (translationIsChineseSource(text, from)) {
        if (!analysisContainsChinese(value)) return false;
        return !target || value !== String(target);
    }
    var first = value.charAt(0);
    return first !== first.toLowerCase() || first === first.toUpperCase();
}

function analysisOneLine(value) {
    return String(value || "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

function analysisLog(message) {
    console.log("[DeepSeek Memory Analysis] " + String(message));
}
