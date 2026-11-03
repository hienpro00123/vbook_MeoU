function execute() {
    var provider = getProviderId(tts_provider);
    var voices = [];
    var voiceSubtitle = "";
    var credSubtitle = "Nhấn Thêm cho từng khóa. VD: ZAI:key_zalo, EL:key_eleven, FPT:key_fpt, VTAI:token_viettel (hoặc nhập thẳng key nếu chỉ dùng dịch vụ đang chọn).";

    if (provider === "zalo") {
        voices = [
            "Zalo AI | Nữ miền Nam",
            "Zalo AI | Nữ miền Bắc",
            "Zalo AI | Nam miền Nam",
            "Zalo AI | Nam miền Bắc"
        ];
        voiceSubtitle = "Zalo AI: 4 giọng chuẩn Bắc/Nam.";
        credSubtitle = "Nhấn Thêm cho từng key Zalo. VD: ZAI:key_cua_ban (hoặc nhập thẳng key nếu chỉ dùng Zalo AI).";
    } else if (provider === "fpt") {
        voices = [
            "FPT.AI | Ban Mai - Nữ miền Bắc (x1)",
            "FPT.AI | Lan Nhi - Nữ miền Nam (x1)",
            "FPT.AI | Lê Minh - Nam miền Bắc (x1)",
            "FPT.AI | Mỹ An - Nữ miền Trung (x1)",
            "FPT.AI | Thu Minh - Nữ miền Bắc (x1)",
            "FPT.AI | Gia Huy - Nam miền Trung (x1)",
            "FPT.AI | Linh San - Nữ miền Nam (x1)"
        ];
        voiceSubtitle = "FPT.AI (x1): Ban Mai, Lan Nhi, Lê Minh, Mỹ An, Thu Minh, Gia Huy, Linh San.";
        credSubtitle = "Nhấn Thêm cho từng key FPT. VD: FPT:key_cua_ban (hoặc nhập thẳng key nếu chỉ dùng FPT.AI).";
    } else if (provider === "viettel") {
        var viettelStatic = [
            "Viettel AI | Quỳnh Anh - Nữ miền Bắc",
            "Viettel AI | Diễm My - Nữ miền Nam",
            "Viettel AI | Thanh Tùng - Nam miền Bắc",
            "Viettel AI | Minh Quân - Nam miền Nam",
            "Viettel AI | Mai Ngọc chất lượng cao - Nữ miền Trung",
            "Viettel AI | Phương Trang chất lượng cao - Nữ miền Bắc",
            "Viettel AI | Thảo Chi chất lượng cao - Nữ miền Bắc",
            "Viettel AI | Thanh Hà chất lượng cao - Nữ miền Bắc",
            "Viettel AI | Phương Ly chất lượng cao - Nữ miền Nam",
            "Viettel AI | Thùy Dung chất lượng cao - Nữ miền Nam",
            "Viettel AI | Bảo Quốc - Nam miền Trung",
            "Viettel AI | Thanh Phương chất lượng cao - Nữ miền Bắc",
            "Viettel AI | Nam Khánh chất lượng cao - Nam miền Bắc",
            "Viettel AI | Lê Yến chất lượng cao - Nữ miền Nam",
            "Viettel AI | Tiến Quân chất lượng cao - Nam miền Bắc",
            "Viettel AI | Thùy Duyên chất lượng cao - Nữ miền Nam"
        ];
        var viettelResult = getViettelVoiceNames();
        if (viettelResult.error) {
            voices = viettelStatic;
            voiceSubtitle = "Dùng danh sách giọng Viettel AI có sẵn (" + viettelResult.error + ").";
        } else {
            voices = viettelResult.names;
            voiceSubtitle = "Đã đồng bộ " + voices.length + " giọng từ Viettel AI.";
        }
        credSubtitle = "Nhấn Thêm cho từng token Viettel. VD: VTAI:token_cua_ban (hoặc nhập thẳng token nếu chỉ dùng Viettel AI).";
    } else if (provider === "elevenlabs") {
        voiceSubtitle = "ElevenLabs: Giá phụ thuộc model, không phụ thuộc giọng.";
        credSubtitle = "Nhấn Thêm cho từng key ElevenLabs. VD: EL:sk_key_cua_ban (hoặc nhập thẳng key nếu chỉ dùng ElevenLabs).";
        var credentials = getElevenLabsCredentials();
        if (credentials.length === 0) {
            voiceSubtitle = "Thêm key EL: trong mục \"API key / token\", sau đó mở lại cài đặt để tải danh sách giọng ElevenLabs.";
        } else {
            var result = getElevenLabsVoiceNames(credentials);
            if (result.error) {
                voiceSubtitle = "Không tải được giọng ElevenLabs (" + result.error + "). Kiểm tra quyền Voices (read) và key EL:.";
            } else {
                voices = result.names;
                voiceSubtitle = "Đã tải " + voices.length + " giọng từ tài khoản ElevenLabs.";
            }
        }
    }

    var selectedVoice = String(typeof tts_voice !== "undefined" && tts_voice ? tts_voice : "");
    var defaultVoice = "";
    if (voices.length > 0) {
        if (selectedVoice && voices.indexOf(selectedVoice) !== -1) {
            defaultVoice = selectedVoice;
        } else {
            defaultVoice = voices[0];
        }
    }

    var configObj = {
        provider_credentials: {
            title: "API key / token",
            subtitle: credSubtitle,
            mode: "list",
            format: "text"
        }
    };

    if (voices.length > 0) {
        configObj.tts_voice = {
            title: "Giọng đọc",
            subtitle: voiceSubtitle,
            default: defaultVoice,
            values: voices,
            mode: "select",
            format: "single"
        };
    }

    return Response.success(configObj);
}

function getProviderId(value) {
    var selected = String(value || "Zalo AI").trim().toLowerCase();
    if (selected === "zai" || selected === "zalo" || selected === "zalo ai") return "zalo";
    if (selected === "el" || selected === "elevenlabs" || selected === "eleven labs") return "elevenlabs";
    if (selected === "fpt" || selected === "fpt.ai") return "fpt";
    if (selected === "vtai" || selected === "viettel" || selected === "viettel ai") return "viettel";
    return "";
}

function getViettelVoiceNames() {
    var response;
    try {
        response = fetch("https://viettelai.vn/tts/voices");
    } catch (e) {
        return { names: [], error: "không kết nối được API" };
    }
    if (!response || !response.ok) return { names: [], error: "HTTP " + (response ? response.status : "0") };
    var data;
    try {
        data = response.json();
    } catch (e) {
        return { names: [], error: "phản hồi JSON không hợp lệ" };
    }
    if (!data || typeof data.length !== "number") {
        return { names: [], error: "phản hồi thiếu danh sách giọng" };
    }
    var names = [];
    for (var i = 0; i < data.length; i++) {
        var voice = data[i];
        if (!voice || !voice.code || !voice.name || !voice.description) continue;
        var name = getViettelVoiceName(voice);
        if (names.indexOf(name) === -1) names.push(name);
    }
    if (names.length === 0) return { names: [], error: "không có giọng khả dụng" };
    return { names: names, error: "" };
}

function getViettelVoiceName(voice) {
    if (voice.code === "hn-quynhanh") return "Viettel AI | Quỳnh Anh - Nữ miền Bắc";
    if (voice.code === "hcm-diemmy") return "Viettel AI | Diễm My - Nữ miền Nam";
    if (voice.code === "hn-thanhtung") return "Viettel AI | Thanh Tùng - Nam miền Bắc";
    if (voice.code === "hcm-minhquan") return "Viettel AI | Minh Quân - Nam miền Nam";
    return "Viettel AI | " + String(voice.name) + " - " + String(voice.description);
}

function getElevenLabsCredentials() {
    var values = [];
    if (typeof localConfig !== "undefined" && typeof localConfig.getItem === "function") {
        values = values.concat(parseCredentialValues(localConfig.getItem("provider_credentials")));
        values = values.concat(parseCredentialValues(localConfig.getItem("provider_credential")));
    }
    if (values.length === 0 && typeof provider_credentials !== "undefined") {
        values = values.concat(parseCredentialValues(provider_credentials));
    }
    var credentials = [];
    for (var i = 0; i < values.length; i++) {
        var value = String(values[i] || "").trim();
        if (!value) continue;
        var separator = value.indexOf(":");
        if (separator > 0) {
            var prefix = value.substring(0, separator).trim().toLowerCase();
            if (prefix === "el" || prefix === "elevenlabs" || prefix === "eleven labs") {
                value = value.substring(separator + 1).trim();
            } else {
                continue;
            }
        } else if (getProviderId(tts_provider) !== "elevenlabs") {
            continue;
        }
        if (value && credentials.indexOf(value) === -1) credentials.push(value);
    }
    return credentials;
}

function parseCredentialValues(raw) {
    var value = String(raw || "").trim();
    if (!value) return [];
    try {
        var parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
    } catch (e) {
        return value.split(/\r?\n/);
    }
}

function getElevenLabsVoiceNames(credentials) {
    var lastStatus = 0;
    for (var keyIndex = 0; keyIndex < credentials.length; keyIndex++) {
        var names = [];
        var nextPageToken = "";
        var seenPageTokens = [];
        var retryWithNextKey = false;
        for (var pageIndex = 0; pageIndex < 100; pageIndex++) {
            var url = "https://api.elevenlabs.io/v2/voices?page_size=100";
            if (nextPageToken) url += "&next_page_token=" + encodeURIComponent(nextPageToken);
            var response;
            try {
                response = fetch(url, {
                    headers: { "xi-api-key": credentials[keyIndex] }
                });
            } catch (e) {
                return { names: [], error: "không kết nối được API" };
            }
            if (!response || !response.ok) {
                lastStatus = response ? response.status : 0;
                if ((lastStatus === 401 || lastStatus === 403 || lastStatus === 429) &&
                    keyIndex < credentials.length - 1) {
                    retryWithNextKey = true;
                    break;
                }
                return { names: [], error: "HTTP " + lastStatus };
            }
            var data;
            try {
                data = response.json();
            } catch (e) {
                return { names: [], error: "phản hồi JSON không hợp lệ" };
            }
            if (!data || !data.voices || typeof data.voices.length !== "number") {
                return { names: [], error: "phản hồi thiếu danh sách giọng" };
            }
            for (var i = 0; i < data.voices.length; i++) {
                var voice = data.voices[i];
                if (!voice || !voice.voice_id) continue;
                var name = "ElevenLabs | " + String(voice.name || voice.voice_id);
                if (names.indexOf(name) === -1) names.push(name);
            }
            if (data.has_more !== true) break;
            nextPageToken = String(data.next_page_token || "");
            if (!nextPageToken || seenPageTokens.indexOf(nextPageToken) !== -1) {
                return { names: [], error: "phân trang giọng ElevenLabs không hợp lệ" };
            }
            seenPageTokens.push(nextPageToken);
            if (pageIndex === 99) {
                return { names: [], error: "vượt giới hạn tải 100 trang giọng" };
            }
        }
        if (retryWithNextKey) continue;
        if (names.length === 0) return { names: [], error: "tài khoản không có giọng khả dụng" };
        return { names: names, error: "" };
    }
    return { names: [], error: "HTTP " + lastStatus };
}
