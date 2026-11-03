function execute() {
    var provider = getProviderId(tts_provider);
    if (!provider) return Response.error("Hãy chọn một nhà cung cấp TTS hợp lệ.");
    if (provider === "elevenlabs") {
        var credentials = getProviderCredentials(provider);
        if (credentials.length === 0) {
            return Response.error("Thêm ít nhất một key có tiền tố \"" + getProviderPrefix(provider) + ":\" trong mục \"API key / token\". VD: EL:sk_key_cua_ban");
        }
        return getElevenLabsVoices(credentials);
    }
    if (provider === "viettel") return getViettelVoices();
    var voices = getStaticVoices(provider);
    var selectedVoice = String(typeof tts_voice !== "undefined" && tts_voice ? tts_voice : "");
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].name === selectedVoice ||
            (provider === "fpt" && voices[i].name + " (x1)" === selectedVoice)) {
            return Response.success([{
                id: voices[i].id,
                name: selectedVoice,
                language: voices[i].language
            }]);
        }
    }
    // Fallback thông minh: Tự chọn giọng đầu tiên của nhà cung cấp hiện tại
    if (voices.length > 0) {
        return Response.success([{
            id: voices[0].id,
            name: voices[0].name,
            language: voices[0].language
        }]);
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
        return getStaticViettelVoices();
    }
    if (!response || !response.ok) {
        return getStaticViettelVoices();
    }
    var data = parseJson(response, "Viettel AI");
    if (data && data.code === 1) return data;
    if (!data || typeof data.length !== "number") {
        return getStaticViettelVoices();
    }
    var voices = [];
    var selectedVoice = String(typeof tts_voice !== "undefined" && tts_voice ? tts_voice : "");
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
        }
        voices.push(voiceData);
    }
    if (voices.length > 0) {
        return Response.success([voices[0]]);
    }
    return getStaticViettelVoices();
}

function getStaticViettelVoices() {
    var staticList = [
        { id: "viettel|hn-quynhanh", name: "Viettel AI | Quỳnh Anh - Nữ miền Bắc", language: "vi-VN" },
        { id: "viettel|hcm-diemmy", name: "Viettel AI | Diễm My - Nữ miền Nam", language: "vi-VN" },
        { id: "viettel|hn-thanhtung", name: "Viettel AI | Thanh Tùng - Nam miền Bắc", language: "vi-VN" },
        { id: "viettel|hcm-minhquan", name: "Viettel AI | Minh Quân - Nam miền Nam", language: "vi-VN" }
    ];
    var selectedVoice = String(typeof tts_voice !== "undefined" && tts_voice ? tts_voice : "");
    for (var i = 0; i < staticList.length; i++) {
        if (staticList[i].name === selectedVoice) return Response.success([staticList[i]]);
    }
    return Response.success([staticList[0]]);
}

function getViettelVoiceName(voice) {
    if (voice.code === "hn-quynhanh") return "Viettel AI | Quỳnh Anh - Nữ miền Bắc";
    if (voice.code === "hcm-diemmy") return "Viettel AI | Diễm My - Nữ miền Nam";
    if (voice.code === "hn-thanhtung") return "Viettel AI | Thanh Tùng - Nam miền Bắc";
    if (voice.code === "hcm-minhquan") return "Viettel AI | Minh Quân - Nam miền Nam";
    return "Viettel AI | " + String(voice.name) + " - " + String(voice.description);
}

function getProviderCredentials(provider) {
    var rawList = [];
    if (typeof localConfig !== "undefined" && typeof localConfig.getItem === "function") {
        rawList = rawList.concat(parseCredentialValues(localConfig.getItem("provider_credentials")));
        rawList = rawList.concat(parseCredentialValues(localConfig.getItem("provider_credential")));
    }
    if (rawList.length === 0 && typeof provider_credentials !== "undefined") {
        rawList = rawList.concat(parseCredentialValues(provider_credentials));
    }
    var credentials = [];
    var currentSelectedProvider = getProviderId(tts_provider);

    for (var i = 0; i < rawList.length; i++) {
        var item = String(rawList[i] || "").trim();
        if (!item) continue;

        var separator = item.indexOf(":");
        var keyVal = item;
        var itemProvider = "";

        if (separator > 0) {
            var prefixCandidate = item.substring(0, separator).trim();
            var parsedProvider = getProviderId(prefixCandidate);
            if (parsedProvider) {
                itemProvider = parsedProvider;
                keyVal = item.substring(separator + 1).trim();
            }
        }

        if (!itemProvider) {
            if (currentSelectedProvider === provider) {
                itemProvider = provider;
            } else {
                continue;
            }
        }

        if (itemProvider !== provider) continue;

        if (keyVal.indexOf("Bearer ") === 0 || keyVal.indexOf("bearer ") === 0) {
            keyVal = keyVal.substring(7).trim();
        }

        if ((keyVal.indexOf('"') === 0 && keyVal.lastIndexOf('"') === keyVal.length - 1 && keyVal.length > 1) ||
            (keyVal.indexOf("'") === 0 && keyVal.lastIndexOf("'") === keyVal.length - 1 && keyVal.length > 1)) {
            keyVal = keyVal.substring(1, keyVal.length - 1).trim();
        }

        if (keyVal && credentials.indexOf(keyVal) === -1) {
            credentials.push(keyVal);
        }
    }
    return credentials;
}

function parseCredentialValues(raw) {
    if (!raw) return [];
    var rawItems = [];
    if (Array.isArray(raw)) {
        rawItems = raw;
    } else if (typeof raw === "string") {
        var trimmed = raw.trim();
        if (trimmed.indexOf("[") === 0 && trimmed.lastIndexOf("]") === trimmed.length - 1) {
            try {
                var parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) rawItems = parsed;
                else rawItems = [trimmed];
            } catch (e) {
                rawItems = [trimmed];
            }
        } else {
            rawItems = [trimmed];
        }
    } else {
        rawItems = [String(raw)];
    }

    var tokens = [];
    for (var i = 0; i < rawItems.length; i++) {
        var item = String(rawItems[i] || "").trim();
        if (!item) continue;
        var parts = item.split(/[\r\n,;]+/);
        for (var j = 0; j < parts.length; j++) {
            var tok = parts[j].trim();
            if ((tok.indexOf('"') === 0 && tok.lastIndexOf('"') === tok.length - 1 && tok.length > 1) ||
                (tok.indexOf("'") === 0 && tok.lastIndexOf("'") === tok.length - 1 && tok.length > 1)) {
                tok = tok.substring(1, tok.length - 1).trim();
            }
            if (tok && tokens.indexOf(tok) === -1) {
                tokens.push(tok);
            }
        }
    }
    return tokens;
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
    var lastError = "";
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
            if (!response || !response.ok) {
                lastStatus = response ? response.status : 0;
                lastError = "HTTP " + lastStatus;
                if (isCredentialFailure(lastStatus) && keyIndex < credentials.length - 1) {
                    retryWithNextKey = true;
                    break;
                }
                return Response.error("Không lấy được danh sách giọng ElevenLabs (" + lastError + ").");
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
                }
                voices.push(voiceData);
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
        if (voices.length > 0) {
            return Response.success([voices[0]]);
        }
        return Response.error("ElevenLabs không có giọng nào khả dụng cho API key này.");
    }
    return Response.error("Tất cả key ElevenLabs đều bị từ chối (" + (lastError || ("HTTP " + lastStatus)) + ").");
}