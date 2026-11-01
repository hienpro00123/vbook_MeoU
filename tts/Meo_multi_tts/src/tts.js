function execute(text, voiceId) {
    var inputText = String(text || "");
    var voiceParts = String(voiceId || "").split("|");
    if (!inputText.trim()) return Response.error("Văn bản đọc đang trống.");
    if (voiceParts.length !== 2 || !voiceParts[1]) {
        return Response.error("Giọng đọc không hợp lệ. Hãy tải lại danh sách giọng.");
    }
    if (inputText.length > 5000) {
        return Response.error("Văn bản vượt quá giới hạn 5000 ký tự mỗi yêu cầu.");
    }

    var provider = getProviderId(tts_provider);
    if (!provider) return Response.error("Loại TTS không được hỗ trợ.");
    if (voiceParts[0] !== provider) {
        return Response.error("Nhà cung cấp đã đổi. Hãy tải lại danh sách và chọn lại giọng.");
    }
    var credentials = getProviderCredentials(provider);
    if (credentials.length === 0) {
        return Response.error("Thêm ít nhất một key có tiền tố \"" + getProviderPrefix(provider) + ":\" trong Danh sách API key / token.");
    }
    var voice = voiceParts[1];
    if (provider === "zalo") return synthesizeZalo(inputText, voice, credentials);
    if (provider === "elevenlabs") return synthesizeElevenLabs(inputText, voice, credentials);
    if (provider === "fpt") return synthesizeFpt(inputText, voice, credentials);
    if (provider === "viettel") return synthesizeViettel(inputText, voice, credentials);
    return Response.error("Nhà cung cấp TTS không được hỗ trợ.");
}

function getProviderId(value) {
    var selected = String(value || "Zalo AI").trim().toLowerCase();
    if (selected === "zai" || selected === "zalo" || selected === "zalo ai") return "zalo";
    if (selected === "el" || selected === "elevenlabs" || selected === "eleven labs") return "elevenlabs";
    if (selected === "fpt" || selected === "fpt.ai") return "fpt";
    if (selected === "vtai" || selected === "viettel" || selected === "viettel ai") return "viettel";
    return "";
}

function getProviderCredentials(provider) {
    var values = parseCredentialValues(localConfig.getItem("provider_credentials"));
    var legacy = localConfig.getItem("provider_credential");
    values = values.concat(parseCredentialValues(legacy));
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

function getProviderName(provider) {
    if (provider === "zalo") return "Zalo AI";
    if (provider === "elevenlabs") return "ElevenLabs";
    if (provider === "fpt") return "FPT.AI";
    if (provider === "viettel") return "Viettel AI";
    return provider;
}

function getProviderPrefix(provider) {
    if (provider === "zalo") return "ZAI";
    if (provider === "elevenlabs") return "EL";
    if (provider === "fpt") return "FPT";
    if (provider === "viettel") return "VTAI";
    return provider;
}

function parseJson(response) {
    try {
        return response.json();
    } catch (e) {
        return null;
    }
}

function downloadAudio(url, provider) {
    var audioResponse = fetch(url);
    if (!audioResponse.ok) {
        return Response.error("Không tải được âm thanh từ " + provider + " (HTTP " + audioResponse.status + ").");
    }
    return Response.success(audioResponse.base64());
}

function synthesizeZalo(inputText, voice, credentials) {
    var lastStatus = 0;
    for (var keyIndex = 0; keyIndex < credentials.length; keyIndex++) {
        for (var attempt = 0; attempt < 2; attempt++) {
            var response = fetch("https://api.zalo.ai/v1/tts/synthesize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "apikey": credentials[keyIndex]
                },
                body: "input=" + encodeURIComponent(inputText) +
                    "&encode_type=mp3&speed=1.0&speaker_id=" + encodeURIComponent(voice)
            });
            if (!response.ok) {
                lastStatus = response.status;
                if (isCredentialFailure(response.status) && keyIndex < credentials.length - 1) break;
                return Response.error("Zalo AI tạo giọng đọc thất bại (HTTP " + response.status + ").");
            }
            var data = parseJson(response);
            if (!data || data.error_code !== 0 || !data.data || !data.data.url) {
                return Response.error("Zalo AI không trả về đường dẫn âm thanh.");
            }

            var audioResponse = fetch(data.data.url);
            if (audioResponse.ok) return Response.success(audioResponse.base64());
            if (audioResponse.status !== 404 || attempt > 0) {
                return Response.error("Không tải được âm thanh từ Zalo AI (HTTP " + audioResponse.status + ").");
            }
            sleep(1000);
        }
    }
    return Response.error("Tất cả key Zalo AI đều bị từ chối (HTTP " + lastStatus + ").");
}

function synthesizeElevenLabs(inputText, voice, credentials) {
    var modelId = getElevenLabsModel();
    if (!modelId) return Response.error("Hãy chọn một model ElevenLabs hợp lệ.");
    var lastStatus = 0;
    for (var keyIndex = 0; keyIndex < credentials.length; keyIndex++) {
        var response = fetch(
            "https://api.elevenlabs.io/v1/text-to-speech/" +
                encodeURIComponent(voice) + "?output_format=mp3_44100_128",
            {
                method: "POST",
                headers: {
                    "xi-api-key": credentials[keyIndex],
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: inputText,
                    model_id: modelId
                })
            }
        );
        if (!response.ok) {
            lastStatus = response.status;
            if (isCredentialFailure(response.status) && keyIndex < credentials.length - 1) continue;
            return Response.error("ElevenLabs tạo giọng đọc thất bại (HTTP " + response.status + ").");
        }
        return Response.success(response.base64());
    }
    return Response.error("Tất cả key ElevenLabs đều bị từ chối (HTTP " + lastStatus + ").");
}

function getElevenLabsModel() {
    var model = String(elevenlabs_model || "eleven_multilingual_v2").trim();
    var prefix = "ElevenLabs | ";
    if (model.indexOf(prefix) === 0) {
        model = model.substring(prefix.length).trim();
    } else if (model.indexOf(" | ") !== -1) {
        return "";
    }
    var priceLabel = model.lastIndexOf(" (x");
    if (priceLabel !== -1 && model.charAt(model.length - 1) === ")") {
        model = model.substring(0, priceLabel).trim();
    }
    if (model === "eleven_multilingual_v2" ||
        model === "eleven_v3" ||
        model === "eleven_turbo_v2_5" ||
        model === "eleven_flash_v2_5") {
        return model;
    }
    return "";
}

function synthesizeFpt(inputText, voice, credentials) {
    if (inputText.length < 3) return Response.error("FPT.AI yêu cầu văn bản có ít nhất 3 ký tự.");
    var lastStatus = 0;
    for (var keyIndex = 0; keyIndex < credentials.length; keyIndex++) {
        var response = fetch("https://api.fpt.ai/hmi/tts/v5", {
            method: "POST",
            headers: {
                "api_key": credentials[keyIndex],
                "voice": voice,
                "speed": "0",
                "format": "mp3",
                "Cache-Control": "no-cache"
            },
            body: inputText
        });
        if (!response.ok) {
            lastStatus = response.status;
            if (isCredentialFailure(response.status) && keyIndex < credentials.length - 1) continue;
            return Response.error("FPT.AI tạo giọng đọc thất bại (HTTP " + response.status + ").");
        }
        var data = parseJson(response);
        if (!data || data.error !== 0 || !data["as" + "ync"]) {
            return Response.error("FPT.AI không trả về đường dẫn âm thanh.");
        }
        lastStatus = 0;
        for (var attempt = 0; attempt < 20; attempt++) {
            if (attempt > 0) sleep(1000);
            response = fetch(data["as" + "ync"]);
            if (response.ok) return Response.success(response.base64());
            if (response.status !== 404) {
                return Response.error("Không tải được âm thanh từ FPT.AI (HTTP " + response.status + ").");
            }
        }
    }
    if (lastStatus) return Response.error("Tất cả key FPT.AI đều bị từ chối (HTTP " + lastStatus + ").");
    return Response.error("Âm thanh FPT.AI chưa sẵn sàng sau 20 giây; hãy thử lại với đoạn văn ngắn hơn.");
}

function synthesizeViettel(inputText, voice, credentials) {
    var lastStatus = 0;
    for (var keyIndex = 0; keyIndex < credentials.length; keyIndex++) {
        var response = fetch("https://viettelai.vn/tts/speech_synthesis", {
            method: "POST",
            headers: {
                "Accept": "*/*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: inputText,
                voice: voice,
                speed: 1,
                tts_return_option: 3,
                token: credentials[keyIndex],
                without_filter: false
            })
        });
        if (!response.ok) {
            lastStatus = response.status;
            if (isCredentialFailure(response.status) && keyIndex < credentials.length - 1) continue;
            return Response.error("Viettel AI tạo giọng đọc thất bại (HTTP " + response.status + ").");
        }
        var contentType = String(response.header("Content-Type") || "").toLowerCase();
        if (contentType.indexOf("json") !== -1) {
            return Response.error("Viettel AI trả về lỗi JSON thay vì tệp âm thanh.");
        }
        return Response.success(response.base64());
    }
    return Response.error("Tất cả token Viettel AI đều bị từ chối (HTTP " + lastStatus + ").");
}
