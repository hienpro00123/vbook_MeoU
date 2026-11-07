load('prompts.js');

function execute() {
    var definitions = translationDefaultStyleDefinitions();
    var styles = [];
    for (var definitionIndex = 0; definitionIndex < definitions.length; definitionIndex++) {
        styles.push({
            id: definitions[definitionIndex].id,
            name: definitions[definitionIndex].name,
            description: definitions[definitionIndex].description
        });
    }

    var known = {};
    for (var i = 0; i < styles.length; i++) known[styles[i].id] = true;

    try {
        var total = localDatabase.count(TRANSLATION_PROMPT_SCOPE, TRANSLATION_PROMPT_TABLE);
        var rows = localDatabase.list(TRANSLATION_PROMPT_SCOPE, TRANSLATION_PROMPT_TABLE, 0, Math.min(total, 200));
        if (total > 200) {
            var recentRows = localDatabase.list(
                TRANSLATION_PROMPT_SCOPE,
                TRANSLATION_PROMPT_TABLE,
                Math.max(0, total - 200),
                200
            );
            var rowKeys = {};
            for (var existingIndex = 0; rows && existingIndex < rows.length; existingIndex++) {
                rowKeys[String(rows[existingIndex].key || "")] = true;
            }
            for (var recentIndex = 0; recentRows && recentIndex < recentRows.length; recentIndex++) {
                var recentKey = String(recentRows[recentIndex].key || "");
                if (!rowKeys[recentKey]) rows.push(recentRows[recentIndex]);
            }
        }
        for (var rowIndex = 0; rows && rowIndex < rows.length; rowIndex++) {
            var id = String(rows[rowIndex].key || "").trim();
            if (!id || known[id]) continue;

            var prompt = String(rows[rowIndex].value || "").replace(/\s+/g, " ").trim();
            var description = prompt ? "Tùy chỉnh: " + prompt : "Prompt tùy chỉnh";
            if (description.length > 140) description = description.substring(0, 137) + "...";
            var name = id;
            if (id.indexOf("auto-genre-") === 0) {
                try {
                    var metadata = JSON.parse(localStorage.getItem(translationGenreStyleMetadataKey(id)) || "{}");
                    if (metadata && metadata.name) name = String(metadata.name);
                    if (metadata && metadata.genre) {
                        description = "Tự tạo theo thể loại: " + String(metadata.genre);
                    }
                } catch (metadataError) {
                    Log.log("[dich_deepseek] Không thể đọc nhãn prompt thể loại: " + metadataError);
                }
            }

            styles.push({
                id: id,
                name: name,
                description: description
            });
            known[id] = true;
        }
    } catch (e) {
        Log.log("[dich_deepseek] Không thể tải prompt phong cách tùy chỉnh: " + e);
    }

    return Response.success(styles);
}
