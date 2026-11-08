load('prompts.js');

function execute() {
    var config = {
        api_key: {
            title: "DeepSeek API keys",
            subtitle: "Danh sách API key; tự chuyển key khi hết quota",
            default: "",
            mode: "list",
            format: "text"
        },
        temperature: {
            title: "Temperature",
            subtitle: "DeepSeek khuyến nghị 1.3 cho dịch; bị bỏ qua khi bật suy nghĩ",
            default: "1.3",
            mode: "input",
            format: "number"
        },
        max_output_tokens: {
            title: "Số token đầu ra tối đa",
            subtitle: "Tối đa 393216 theo DeepSeek; token suy nghĩ cũng tính vào giới hạn",
            default: "16384",
            mode: "input",
            format: "number"
        },
        genre_analysis_model: {
            title: "Model phân tích thể loại",
            subtitle: "Chỉ dùng khi phân tích thể loại và tạo prompt phong cách",
            default: "deepseek-flash",
            values: ["deepseek-flash", "deepseek-v4-pro"],
            mode: "select",
            format: "single"
        },
        genre_analysis_reasoning_effort: {
            title: "Mức suy nghĩ khi tạo prompt phong cách",
            subtitle: "none tắt suy nghĩ; low/high/max tăng dần độ suy luận, thời gian và lượng token",
            default: "none",
            values: ["none", "low", "high", "max"],
            mode: "select",
            format: "single"
        },
        translation_reasoning_effort: {
            title: "Mức suy nghĩ khi dịch",
            subtitle: "Áp dụng cho dịch chính và các lần sửa/thử lại; none tắt suy nghĩ để tiết kiệm token",
            default: "none",
            values: ["none", "low", "high", "max"],
            mode: "select",
            format: "single"
        },

        retry_untranslated_chinese: {
            title: "Tự sửa phần tiếng Trung còn sót",
            subtitle: "Gom chữ Hán còn sót trong văn bản thường để sửa; giữ nguyên thẻ, URL, placeholder và các khối mã",
            default: "true",
            mode: "toggle"
        },
        retry_untranslated_result: {
            title: "Thử lại nếu kết quả chưa được dịch",
            subtitle: "Gửi lại một lần không kèm bộ nhớ dịch khi phản hồi gần như chép nguyên văn; báo lỗi nếu vẫn chưa dịch",
            default: "true",
            mode: "toggle"
        },
        cache_translated_chapters: {
            title: "Lưu bản dịch chương trên thiết bị",
            subtitle: "Dùng lại đoạn đã dịch; tối đa 200 đoạn hoặc 1 triệu ký tự. Dùng action xóa cache truyện hiện tại khi muốn dịch lại",
            default: "true",
            mode: "toggle"
        },
        system_prompt: {
            title: "Prompt hệ thống dịch thuật",
            subtitle: "Prompt gọn, tránh lặp quy tắc; 4 phần phong cách, ngữ cảnh, yêu cầu riêng và bộ nhớ được tự chèn khi dịch",
            default: translationSystemPromptDefault(),
            mode: "input",
            format: "text"
        },
        translate_table_of_content: {
            title: "Dùng DeepSeek dịch mục lục",
            subtitle: "Tắt: dùng QT trước, sau đó fallback sang Baidu",
            default: "false",
            mode: "toggle"
        },
        translate_detail: {
            title: "Dùng DeepSeek dịch chi tiết",
            subtitle: "Tắt: dùng QT trước, sau đó fallback sang Baidu",
            default: "false",
            mode: "toggle"
        },
        translate_discovery: {
            title: "Dùng DeepSeek dịch khám phá",
            subtitle: "Tắt: dùng QT trước, sau đó fallback sang Baidu",
            default: "false",
            mode: "toggle"
        },
        use_qt_fallback: {
            title: "Ưu tiên QT khi dịch bổ sung",
            subtitle: "Chỉ áp dụng cho nội dung tiếng Trung sang tiếng Việt; nếu tắt hoặc QT không dùng được sẽ chuyển sang Baidu",
            default: "true",
            mode: "toggle"
        },
        translation_prompts: {
            title: "Prompt phong cách dịch truyện",
            subtitle: "Dùng chung cho mọi truyện; Trung tính là mặc định. Khi thêm prompt mới, để trống bookId, nhập key là ID style và value là nội dung prompt",
            mode: "database"
        },
        use_translation_memory: {
            title: "Sử dụng bộ nhớ dịch",
            subtitle: "Áp dụng bộ nhớ theo cặp ngôn ngữ đã ghi nhớ cho truyện hiện tại",
            default: "true",
            mode: "toggle"
        },
        auto_translation_memory: {
            title: "Tự động học bộ nhớ dịch",
            subtitle: "Tự lưu tên riêng và thuật ngữ trong cùng lượt gọi DeepSeek khi dịch chương; chỉ hoạt động khi Sử dụng bộ nhớ dịch đang bật",
            default: "true",
            mode: "toggle"
        },
        auto_analyze_translation_memory: {
            title: "Tự động phân tích tên và quan hệ",
            subtitle: "Sau khi DeepSeek dịch chương, tự phân tích chương đó một lần để bổ sung tên, biệt danh và cập nhật quan hệ; cần thêm thời gian và một lượt gọi API",
            default: "false",
            mode: "toggle"
        },
        memory_analysis_chapters: {
            title: "Số chương phân tích",
            subtitle: "Số chương mới cần xử lý mỗi lần chạy action thủ công; action tiếp tục từ tiến độ đã lưu",
            default: "5",
            mode: "input",
            format: "number"
        }
    };

    try {
        initializeTranslationPrompts();
    } catch (promptError) {
        return Response.error("Không thể cập nhật prompt dịch: " + String(promptError));
    }

    var bookInfo = null;
    try {
        bookInfo = localBook.getInfo();
    } catch (e) {}

    if (bookInfo && bookInfo.id) {
        var bookPromptKey = translationBookPromptConfigKey(String(bookInfo.id));
        config[bookPromptKey] = {
            title: "Yêu cầu dịch riêng cho truyện",
            subtitle: "Chỉ áp dụng cho truyện hiện tại, ví dụ: giữ cách xưng hô theo phong cách kiếm hiệp",
            default: "",
            mode: "input",
            format: "text"
        };
        config.translation_memory = {
            title: "Bộ nhớ dịch theo truyện",
            subtitle: "Tên riêng, địa danh, thuật ngữ và quan hệ do DeepSeek ghi nhớ; có thể thêm, sửa hoặc xóa thủ công",
            mode: "database"
        };
    }

    var versionedConfig = {};
    for (var key in config) {
        if (!config.hasOwnProperty(key) || key === "translation_prompts" || key === "translation_memory") continue;
        versionedConfig[translationConfigKey(key)] = config[key];
    }
    versionedConfig.translation_prompts = config.translation_prompts;
    if (config.translation_memory) versionedConfig.translation_memory = config.translation_memory;

    return Response.success(versionedConfig);
}

function initializeTranslationPrompts() {
    if (localStorage.getItem(TRANSLATION_PROMPT_VERSION_KEY) === TRANSLATION_PROMPT_VERSION) return;

    var defaults = translationDefaultPrompts();
    var rows = [];
    for (var style in defaults) {
        if (!defaults.hasOwnProperty(style)) continue;
        var storedPrompt = localDatabase.get(TRANSLATION_PROMPT_SCOPE, TRANSLATION_PROMPT_TABLE, style);
        if (storedPrompt !== null && storedPrompt !== undefined) {
            if (String(storedPrompt) !== translationPreviousDefaultPrompt(style)) continue;
        }
        rows.push({ key: style, value: defaults[style] });
    }
    if (rows.length > 0) localDatabase.upsertAll(TRANSLATION_PROMPT_SCOPE, TRANSLATION_PROMPT_TABLE, rows);
    localStorage.setItem(TRANSLATION_PROMPT_VERSION_KEY, TRANSLATION_PROMPT_VERSION);
}
