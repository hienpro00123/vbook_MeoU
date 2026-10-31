function execute() {
    var provider = getProviderId(tts_provider);
    var voices = [
        "Zalo AI | Nữ miền Nam",
        "Zalo AI | Nữ miền Bắc",
        "Zalo AI | Nam miền Nam",
        "Zalo AI | Nam miền Bắc",
        "FPT.AI | Ban Mai - Nữ miền Bắc (x1)",
        "FPT.AI | Lan Nhi - Nữ miền Nam (x1)",
        "FPT.AI | Lê Minh - Nam miền Bắc (x1)",
        "FPT.AI | Mỹ An - Nữ miền Trung (x1)",
        "FPT.AI | Thu Minh - Nữ miền Bắc (x1)",
        "FPT.AI | Gia Huy - Nam miền Trung (x1)",
        "FPT.AI | Linh San - Nữ miền Nam (x1)",
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
    var voiceSubtitle = "FPT x1: cùng giá theo gói; ElevenLabs: giá theo model. Zalo/Viettel chưa công khai giá theo voice.";
    if (provider === "elevenlabs") {
        var credentials = getElevenLabsCredentials();
        if (credentials.length === 0) {
            voiceSubtitle = "Thêm key EL: trong Danh sách API key / token, sau đó mở lại cài đặt để tải giọng ElevenLabs.";
        } else {
            var result = getElevenLabsVoiceNames(credentials);
            if (result.error) {
                voiceSubtitle = "Không tải được giọng ElevenLabs (" + result.error + "). Kiểm tra quyền Voices (read) và key EL:.";
            } else {
                voices = voices.concat(result.names);
            }
        }
    } else if (provider === "viettel") {
        var viettelResult = getViettelVoiceNames();
        if (viettelResult.error) {
            voiceSubtitle = "Không tải được danh sách giọng Viettel AI (" + viettelResult.error + ").";
        } else {
            for (var voiceIndex = 0; voiceIndex < viettelResult.names.length; voiceIndex++) {
                if (voices.indexOf(viettelResult.names[voiceIndex]) === -1) {
                    voices.push(viettelResult.names[voiceIndex]);
                }
            }
        }
    }
    return Response.success({
        tts_voice: {
            title: "Giọng đọc",
            subtitle: voiceSubtitle,
            default: String(tts_voice || "Zalo AI | Nữ miền Nam"),
            values: voices,
            mode: "select",
            format: "single"
        }
    });
}

function getProviderId(value) {
    var selected = String(value || "").trim().toLowerCase();
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
    if (!response.ok) return { names: [], error: "HTTP " + response.status };
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
    var values = parseCredentialValues(localConfig.getItem("provider_credentials"));
    values = values.concat(parseCredentialValues(localConfig.getItem("provider_credential")));
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
            if (!response.ok) {
                lastStatus = response.status;
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
