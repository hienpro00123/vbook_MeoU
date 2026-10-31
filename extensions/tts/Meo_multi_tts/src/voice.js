function execute() {
    var provider = getProviderId(tts_provider);
    if (!provider) return Response.error("Hãy chọn một nhà cung cấp TTS hợp lệ.");
    if (provider === "elevenlabs") {
        var credentials = getProviderCredentials(provider);
        if (credentials.length === 0) {
            return Response.error("Thêm ít nhất một key có tiền tố \"" + getProviderPrefix(provider) + ":\" trong Danh sách API key / token.");
        }
        return getElevenLabsVoices(credentials);
    }
    if (provider === "viettel") return getViettelVoices();
    var voices = getStaticVoices(provider);
    for (var i = 0; i < voices.length; i++) {
        var selectedVoice = String(tts_voice || "");
        if (voices[i].name === selectedVoice ||
            (provider === "fpt" && voices[i].name + " (x1)" === selectedVoice)) {
            return Response.success([{
                id: voices[i].id,
                name: selectedVoice,
                language: voices[i].language
            }]);
        }
    }
    return Response.error("Chọn giọng có tiền tố \"" + getProviderName(provider) + " |\" trong cài đặt.");
}

function getStaticVoices(provider) {
    if (provider === "zalo") {
        return [
            { id: "zalo|1", name: "Zalo AI | Nữ miền Nam", language: "vi-VN" },
            { id: "zalo|2", name: "Zalo AI | Nữ miền Bắc", language: "vi-VN" },
            { id: "zalo|3", name: "Zalo AI | Nam miền Nam", language: "vi-VN" },
            { id: "zalo|4", name: "Zalo AI | Nam miền Bắc", language: "vi-VN" }
        ];
    }
    if (provider === "fpt") {
        return [
            { id: "fpt|banmai", name: "FPT.AI | Ban Mai - Nữ miền Bắc", language: "vi-VN" },
            { id: "fpt|lannhi", name: "FPT.AI | Lan Nhi - Nữ miền Nam", language: "vi-VN" },
            { id: "fpt|leminh", name: "FPT.AI | Lê Minh - Nam miền Bắc", language: "vi-VN" },
            { id: "fpt|myan", name: "FPT.AI | Mỹ An - Nữ miền Trung", language: "vi-VN" },
            { id: "fpt|thuminh", name: "FPT.AI | Thu Minh - Nữ miền Bắc", language: "vi-VN" },
            { id: "fpt|giahuy", name: "FPT.AI | Gia Huy - Nam miền Trung", language: "vi-VN" },
            { id: "fpt|linhsan", name: "FPT.AI | Linh San - Nữ miền Nam", language: "vi-VN" }
        ];
    }
    return [];
}

function getViettelVoices() {
    var response;
    try {
        response = fetch("https://viettelai.vn/tts/voices");
    } catch (e) {
        return Response.error("Không kết nối được danh sách giọng Viettel AI.");
    }
    if (!response.ok) {
        return Response.error("Không lấy được danh sách giọng Viettel AI (HTTP " + response.status + ").");
    }
    var data = parseJson(response, "Viettel AI");
    if (data && data.code === 1) return data;
    if (!data || typeof data.length !== "number") {
        return Response.error("Phản hồi danh sách giọng Viettel AI không hợp lệ.");
    }
    var voices = [];
    var selectedVoice = String(tts_voice || "");
    for (var i = 0; i < data.length; i++) {
        var voice = data[i];
        if (!voice || !voice.code || !voice.name || !voice.description) continue;
        var voiceData = {
            id: "viettel|" + voice.code,
            name: getViettelVoiceName(voice),
            language: "vi-VN"
        };
        if (selectedVoice.indexOf("Viettel AI |") === 0) {
            if (voiceData.name === selectedVoice) return Response.success([voiceData]);
        } else {
            voices.push(voiceData);
        }
    }
    if (selectedVoice.indexOf("Viettel AI |") === 0) {
        return Response.error("Không tìm thấy giọng Viettel AI đã chọn. Hãy tải lại danh sách trong cài đặt.");
    }
    if (voices.length === 0) return Response.error("Viettel AI không có giọng nào khả dụng.");
    return Response.success(voices);
}

function getViettelVoiceName(voice) {
    if (voice.code === "hn-quynhanh") return "Viettel AI | Quỳnh Anh - Nữ miền Bắc";
    if (voice.code === "hcm-diemmy") return "Viettel AI | Diễm My - Nữ miền Nam";
    if (voice.code === "hn-thanhtung") return "Viettel AI | Thanh Tùng - Nam miền Bắc";
    if (voice.code === "hcm-minhquan") return "Viettel AI | Minh Quân - Nam miền Nam";
    return "Viettel AI | " + String(voice.name) + " - " + String(voice.description);
}

function getProviderCredentials(provider) {
    var values = parseCredentialValues(localConfig.getItem("provider_credentials"));
    values = values.concat(parseCredentialValues(localConfig.getItem("provider_credential")));
    var credentials = [];
    for (var i = 0; i < values.length; i++) {
        var value = String(values[i] || "").trim();
        if (!value) continue;
        var separator = value.indexOf(":");
        if (separator > 0) {
            var configuredProvider = getProviderId(value.substring(0, separator));
            if (configuredProvider) {
                if (configuredProvider !== provider) continue;
                value = value.substring(separator + 1).trim();
            }
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

function isCredentialFailure(status) {
    return status === 401 || status === 403 || status === 429;
}

function getProviderPrefix(provider) {
    if (provider === "zalo") return "ZAI";
    if (provider === "elevenlabs") return "EL";
    if (provider === "fpt") return "FPT";
    if (provider === "viettel") return "VTAI";
    return provider;
}

function getProviderName(provider) {
    if (provider === "zalo") return "Zalo AI";
    if (provider === "elevenlabs") return "ElevenLabs";
    if (provider === "fpt") return "FPT.AI";
    if (provider === "viettel") return "Viettel AI";
    return provider;
}

function getProviderId(value) {
    var selected = String(value || "Zalo AI").trim().toLowerCase();
    if (selected === "zai" || selected === "zalo" || selected === "zalo ai") return "zalo";
    if (selected === "el" || selected === "elevenlabs" || selected === "eleven labs") return "elevenlabs";
    if (selected === "fpt" || selected === "fpt.ai") return "fpt";
    if (selected === "vtai" || selected === "viettel" || selected === "viettel ai") return "viettel";
    return "";
}

function parseJson(response, provider) {
    try {
        return response.json();
    } catch (e) {
        return Response.error(provider + " trả về dữ liệu không hợp lệ.");
    }
}

function getElevenLabsVoices(credentials) {
    var lastStatus = 0;
    for (var keyIndex = 0; keyIndex < credentials.length; keyIndex++) {
        var voices = [];
        var nextPageToken = "";
        var seenPageTokens = [];
        var retryWithNextKey = false;
        for (var pageIndex = 0; pageIndex < 100; pageIndex++) {
            var url = "https://api.elevenlabs.io/v2/voices?page_size=100";
            if (nextPageToken) url += "&next_page_token=" + encodeURIComponent(nextPageToken);
            var response = fetch(url, {
                headers: { "xi-api-key": credentials[keyIndex] }
            });
            if (!response.ok) {
                lastStatus = response.status;
                if (isCredentialFailure(response.status) && keyIndex < credentials.length - 1) {
                    retryWithNextKey = true;
                    break;
                }
                return Response.error("Không lấy được danh sách giọng ElevenLabs (HTTP " + response.status + ").");
            }
            var data = parseJson(response, "ElevenLabs");
            if (data && data.code === 1) return data;
            if (!data || !data.voices || typeof data.voices.length !== "number") {
                return Response.error("Phản hồi danh sách giọng ElevenLabs thiếu dữ liệu.");
            }
            for (var i = 0; i < data.voices.length; i++) {
                var voice = data.voices[i];
                if (!voice || !voice.voice_id) continue;
                var voiceData = {
                    id: "elevenlabs|" + voice.voice_id,
                    name: "ElevenLabs | " + (voice.name || voice.voice_id),
                    language: voice.labels && voice.labels.language ? voice.labels.language : "en"
                };
                if (String(tts_voice || "").indexOf("ElevenLabs |") === 0) {
                    if (voiceData.name === String(tts_voice)) return Response.success([voiceData]);
                } else {
                    voices.push(voiceData);
                }
            }
            if (data.has_more !== true) break;
            nextPageToken = String(data.next_page_token || "");
            if (!nextPageToken || seenPageTokens.indexOf(nextPageToken) !== -1) {
                return Response.error("Phân trang danh sách giọng ElevenLabs không hợp lệ.");
            }
            seenPageTokens.push(nextPageToken);
            if (pageIndex === 99) {
                return Response.error("Danh sách giọng ElevenLabs vượt giới hạn tải 100 trang.");
            }
        }
        if (retryWithNextKey) continue;
        if (String(tts_voice || "").indexOf("ElevenLabs |") === 0) {
            return Response.error("Không tìm thấy giọng ElevenLabs đã chọn. Hãy tải lại danh sách trong cài đặt.");
        }
        if (voices.length === 0) return Response.error("ElevenLabs không có giọng nào khả dụng cho API key này.");
        return Response.success(voices);
    }
    return Response.error("Tất cả key ElevenLabs đều bị từ chối (HTTP " + lastStatus + ").");
}
