function execute(text, voiceId) {
    var rawText = String(text || "");
    var inputText = cleanText(rawText);
    var voiceParts = String(voiceId || "").split("|");

    if (!inputText) return Response.error("Văn bản đọc đang trống.");
    if (voiceParts.length !== 2 || !voiceParts[1]) {
        return Response.error("Giọng đọc không hợp lệ. Hãy tải lại danh sách giọng.");
    }

    var maxLimit = 5000;
    if (typeof max_length !== "undefined" && max_length) {
        var parsedLimit = parseInt(max_length, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
            maxLimit = parsedLimit;
        }
    }
    if (inputText.length > maxLimit) {
        inputText = inputText.substring(0, maxLimit);
    }

    var provider = getProviderId(tts_provider);
    if (!provider) return Response.error("Loại TTS không được hỗ trợ.");
    if (voiceParts[0] !== provider) {
        return Response.error("Nhà cung cấp đã đổi. Hãy tải lại danh sách và chọn lại giọng.");
    }

    var credentials = getProviderCredentials(provider);
    if (credentials.length === 0) {
        var prefix = getProviderPrefix(provider);
        return Response.error("Thêm ít nhất một key có tiền tố \"" + prefix + ":\" trong mục \"API key / token\". VD: " + getExampleKey(provider));
    }

    var voice = voiceParts[1];
    if (provider === "zalo") return synthesizeZalo(inputText, voice, credentials);
    if (provider === "elevenlabs") return synthesizeElevenLabs(inputText, voice, credentials);
    if (provider === "fpt") return synthesizeFpt(inputText, voice, credentials);
    if (provider === "viettel") return synthesizeViettel(inputText, voice, credentials);
    return Response.error("Nhà cung cấp TTS không được hỗ trợ.");
}

function cleanText(raw) {
    if (!raw) return "";
    var s = String(raw);
    s = s.replace(/<[^>]*>/g, " ");
    s = s.replace(/&amp;/g, "&")
         .replace(/&lt;/g, "<")
         .replace(/&gt;/g, ">")
         .replace(/&quot;/g, '"')
         .replace(/&#39;/g, "'")
         .replace(/&nbsp;/g, " ")
         .replace(/&#160;/g, " ");
    s = s.replace(/^[\s\*\-\=_#~]+$/gm, "");
    s = s.replace(/[ \t\r\n]+/g, " ").trim();
    return s;
}

function getExampleKey(provider) {
    if (provider === "zalo") return "ZAI:key_zalo (hoặc nhập thẳng key)";
    if (provider === "elevenlabs") return "EL:sk_key_eleven (hoặc nhập thẳng key)";
    if (provider === "fpt") return "FPT:key_fpt (hoặc nhập thẳng key)";
    if (provider === "viettel") return "VTAI:token_viettel (hoặc nhập thẳng token)";
    return "key_cua_ban";
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
            var configuredProvider = getProviderId(value.substring(0, separator));
            if (configuredProvider) {
                if (configuredProvider !== provider) continue;
                value = value.substring(separator + 1).trim();
            }
        } else if (getProviderId(tts_provider) !== provider) {
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

function parseJson(response) {
    try {
        return response.json();
    } catch (e) {
        return null;
    }
}

function synthesizeZalo(inputText, voice, credentials) {
    var lastError = "";
    var lastStatus = 0;
    for (var keyIndex = 0; keyIndex < credentials.length; keyIndex++) {
        var key = credentials[keyIndex];
        var response = fetch("https://api.zalo.ai/v1/tts/synthesize", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "apikey": key
            },
            body: "input=" + encodeURIComponent(inputText) +
                "&encode_type=mp3&speed=1.0&speaker_id=" + encodeURIComponent(voice)
        });
        if (!response || !response.ok) {
            lastStatus = response ? response.status : 0;
            lastError = "HTTP " + lastStatus;
            if (isCredentialFailure(lastStatus) && keyIndex < credentials.length - 1) {
                continue;
            }
            return Response.error("Zalo AI tạo giọng đọc thất bại (" + lastError + ").");
        }
        var data = parseJson(response);
        if (!data) {
            lastError = "Phản hồi không hợp lệ";
            if (keyIndex < credentials.length - 1) continue;
            return Response.error("Zalo AI trả về phản hồi không hợp lệ.");
        }
        if (data.error_code !== 0) {
            lastError = data.error_message || data.message || ("Mã lỗi " + data.error_code);
            if (keyIndex < credentials.length - 1) continue;
            return Response.error("Zalo AI: " + lastError);
        }
        if (!data.data || !data.data.url) {
            lastError = "Không có đường dẫn âm thanh";
            if (keyIndex < credentials.length - 1) continue;
            return Response.error("Zalo AI không trả về đường dẫn âm thanh.");
        }

        var audioUrl = data.data.url;
        for (var attempt = 0; attempt < 15; attempt++) {
            if (attempt > 0) sleep(1000);
            var audioResponse = fetch(audioUrl);
            if (audioResponse && audioResponse.ok) {
                return Response.success(audioResponse.base64());
            }
            if (audioResponse && audioResponse.status !== 404) {
                lastError = "HTTP " + audioResponse.status;
                break;
            }
        }
        lastError = "Hết thời gian chờ tạo âm thanh";
        if (keyIndex < credentials.length - 1) continue;
    }
    return Response.error("Tất cả key Zalo AI đều thất bại (" + (lastError || ("HTTP " + lastStatus)) + ").");
}

function synthesizeElevenLabs(inputText, voice, credentials) {
    var modelId = getElevenLabsModel();
    if (!modelId) return Response.error("Hãy chọn một model ElevenLabs hợp lệ.");
    var lastError = "";
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
        if (!response || !response.ok) {
            lastStatus = response ? response.status : 0;
            var errData = response ? parseJson(response) : null;
            var detailMsg = "";
            if (errData && errData.detail) {
                detailMsg = typeof errData.detail === "object" ? (errData.detail.message || errData.detail.status || "") : String(errData.detail);
            }
            lastError = detailMsg || ("HTTP " + lastStatus);
            if ((isCredentialFailure(lastStatus) || lastStatus === 400) && keyIndex < credentials.length - 1) {
                continue;
            }
            return Response.error("ElevenLabs: " + lastError);
        }
        return Response.success(response.base64());
    }
    return Response.error("Tất cả key ElevenLabs đều thất bại (" + (lastError || ("HTTP " + lastStatus)) + ").");
}

function getElevenLabsModel() {
    var model = String(typeof elevenlabs_model !== "undefined" && elevenlabs_model ? elevenlabs_model : "eleven_multilingual_v2").trim();
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
    var textToSend = inputText;
    if (textToSend.length < 3) {
        textToSend = textToSend + "...";
    }
    var lastError = "";
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
            body: textToSend
        });
        if (!response || !response.ok) {
            lastStatus = response ? response.status : 0;
            lastError = "HTTP " + lastStatus;
            if (isCredentialFailure(lastStatus) && keyIndex < credentials.length - 1) continue;
            return Response.error("FPT.AI tạo giọng đọc thất bại (" + lastError + ").");
        }
        var data = parseJson(response);
        if (!data) {
            lastError = "Phản hồi không hợp lệ";
            if (keyIndex < credentials.length - 1) continue;
            return Response.error("FPT.AI trả về dữ liệu không hợp lệ.");
        }
        if (data.error !== 0) {
            lastError = data.message || ("Mã lỗi " + data.error);
            if (keyIndex < credentials.length - 1) continue;
            return Response.error("FPT.AI: " + lastError);
        }
        if (!data["as" + "ync"]) {
            lastError = "Không có đường dẫn âm thanh";
            if (keyIndex < credentials.length - 1) continue;
            return Response.error("FPT.AI không trả về đường dẫn âm thanh.");
        }

        var asyncUrl = data["as" + "ync"];
        for (var attempt = 0; attempt < 25; attempt++) {
            if (attempt > 0) sleep(1000);
            var audioResponse = fetch(asyncUrl);
            if (audioResponse && audioResponse.ok) return Response.success(audioResponse.base64());
            if (audioResponse && audioResponse.status !== 404) {
                lastError = "HTTP " + audioResponse.status;
                break;
            }
        }
        lastError = "Hết thời gian chờ tạo âm thanh";
        if (keyIndex < credentials.length - 1) continue;
    }
    if (lastError) return Response.error("Tất cả key FPT.AI đều thất bại (" + lastError + ").");
    return Response.error("Âm thanh FPT.AI chưa sẵn sàng; hãy thử lại với đoạn văn ngắn hơn.");
}

function synthesizeViettel(inputText, voice, credentials) {
    var lastError = "";
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
        if (!response || !response.ok) {
            lastStatus = response ? response.status : 0;
            lastError = "HTTP " + lastStatus;
            if (isCredentialFailure(lastStatus) && keyIndex < credentials.length - 1) continue;
            return Response.error("Viettel AI tạo giọng đọc thất bại (" + lastError + ").");
        }
        var contentType = String(response.header("Content-Type") || "").toLowerCase();
        if (contentType.indexOf("json") !== -1) {
            var data = parseJson(response);
            var msg = (data && (data.message || data.error || data.status)) ? (data.message || data.error || ("Lỗi " + data.status)) : "Lỗi phản hồi JSON";
            lastError = msg;
            if (keyIndex < credentials.length - 1) continue;
            return Response.error("Viettel AI: " + msg);
        }
        return Response.success(response.base64());
    }
    return Response.error("Tất cả token Viettel AI đều thất bại (" + (lastError || ("HTTP " + lastStatus)) + ").");
}
