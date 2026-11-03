var RE_TAGS = /<[^>]*>/g;
var RE_DIVIDERS = /^[\s\*\-\=_#~\|\/\\]+$/gm;
var RE_SPACES = /[ \t\r\n]+/g;
var RE_ENTITIES = /&(?:amp|lt|gt|quot|#39|nbsp|#160);/g;
var RE_URL = /https?:\/\/\S+/g;
var RE_EMAIL = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
var RE_HASHTAG = /#[^\s#]+/g;
var ENTITY_MAP = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&#160;": " "
};

// Ghi nhớ key đang hoạt động cho từng nhà cung cấp trong phiên đọc
var ACTIVE_KEY_INDEX = {
    zalo: -1,
    elevenlabs: -1,
    fpt: -1,
    viettel: -1
};

// Cooldown: lưu timestamp hết hạn của key chết { "provider:index": expireMs }
var DEAD_KEY_UNTIL = {};

// Thời gian cooldown (ms) tùy theo loại lỗi
var COOLDOWN_429   = 60000;  // Rate limit: 60 giây
var COOLDOWN_AUTH  = 600000; // 401/403: 10 phút (cả phiên)
var COOLDOWN_ERROR = 15000;  // Lỗi khác: 15 giây

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
    // Xóa HTML tags
    s = s.replace(RE_TAGS, " ");
    // Giải mã HTML entities
    s = s.replace(RE_ENTITIES, function(m) {
        return ENTITY_MAP[m] || m;
    });
    // Xóa URL và email (TTS sẽ đọc sai)
    s = s.replace(RE_URL, "");
    s = s.replace(RE_EMAIL, "");
    // Xóa hashtag
    s = s.replace(RE_HASHTAG, "");
    // Xóa dòng chỉ chứa ký tự phân cách/trang trí
    s = s.replace(RE_DIVIDERS, "");
    // Chuẩn hóa khoảng trắng
    s = s.replace(RE_SPACES, " ").trim();
    return s;
}

function getKeyStrategy() {
    var strategy = String(typeof key_strategy !== "undefined" && key_strategy ? key_strategy : "").toLowerCase();
    if (strategy.indexOf("tuần tự") !== -1 || strategy.indexOf("failover") !== -1) {
        return "failover";
    }
    return "round-robin";
}

// Lấy key bắt đầu cho vòng thử: ưu tiên key đã ghi nhớ, nếu phiên mới dùng seed theo thời gian
function getStartIndex(provider, totalKeys, strategy) {
    var stored = ACTIVE_KEY_INDEX[provider];
    if (stored >= 0 && stored < totalKeys) {
        return stored;
    }
    // Phiên mới: dùng seed thời gian giây / 3 để câu đầu của mỗi lần mở sách
    // sẽ bắt đầu từ key khác nhau, tránh luôn đè tải lên key 0
    if (strategy === "round-robin" && totalKeys > 1) {
        return Math.floor(Date.now() / 3000) % totalKeys;
    }
    return 0;
}

function isKeyDead(provider, keyIndex) {
    var key = provider + ":" + keyIndex;
    var until = DEAD_KEY_UNTIL[key];
    if (!until) return false;
    if (Date.now() < until) return true;
    // Cooldown hết: hồi sinh key
    delete DEAD_KEY_UNTIL[key];
    return false;
}

function markKeyDead(provider, keyIndex, cooldownMs) {
    DEAD_KEY_UNTIL[provider + ":" + keyIndex] = Date.now() + cooldownMs;
}

function recordKeyOutcome(provider, keyIndex, totalKeys, strategy, isSuccess) {
    if (totalKeys <= 1) {
        ACTIVE_KEY_INDEX[provider] = 0;
        return;
    }
    if (isSuccess) {
        if (strategy === "round-robin") {
            // Luân phiên sang key tiếp theo cho câu kế
            ACTIVE_KEY_INDEX[provider] = (keyIndex + 1) % totalKeys;
        } else {
            // Failover: giữ key đang dùng tốt
            ACTIVE_KEY_INDEX[provider] = keyIndex;
        }
    } else {
        // Thất bại: đổi sang key tiếp theo
        ACTIVE_KEY_INDEX[provider] = (keyIndex + 1) % totalKeys;
    }
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

function getProviderPrefix(provider) {
    if (provider === "zalo") return "ZAI";
    if (provider === "elevenlabs") return "EL";
    if (provider === "fpt") return "FPT";
    if (provider === "viettel") return "VTAI";
    return provider;
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

function getCooldownMs(status) {
    if (status === 429) return COOLDOWN_429;
    if (status === 401 || status === 403) return COOLDOWN_AUTH;
    return COOLDOWN_ERROR;
}

function parseJson(response) {
    try {
        return response.json();
    } catch (e) {
        return null;
    }
}

function synthesizeZalo(inputText, voice, credentials) {
    var strategy = getKeyStrategy();
    var lastError = "";
    var lastStatus = 0;
    var totalKeys = credentials.length;
    var startIndex = getStartIndex("zalo", totalKeys, strategy);

    // Chu kỳ thăm dò thích ứng sớm: 250ms → 350ms → 500ms...
    var delays = [250, 350, 500, 650, 800, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000];
    var tried = 0;

    for (var i = 0; i < totalKeys; i++) {
        var keyIndex = (startIndex + i) % totalKeys;

        // Bỏ qua key đang trong cooldown
        if (isKeyDead("zalo", keyIndex)) continue;
        tried++;

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
            markKeyDead("zalo", keyIndex, getCooldownMs(lastStatus));
            recordKeyOutcome("zalo", keyIndex, totalKeys, strategy, false);
            if (isCredentialFailure(lastStatus) && i < totalKeys - 1) continue;
            return Response.error("Zalo AI tạo giọng đọc thất bại (" + lastError + ").");
        }

        var data = parseJson(response);
        if (!data) {
            lastError = "Phản hồi không hợp lệ";
            markKeyDead("zalo", keyIndex, COOLDOWN_ERROR);
            recordKeyOutcome("zalo", keyIndex, totalKeys, strategy, false);
            if (i < totalKeys - 1) continue;
            return Response.error("Zalo AI trả về phản hồi không hợp lệ.");
        }

        if (data.error_code !== 0) {
            lastError = data.error_message || data.message || ("Mã lỗi " + data.error_code);
            markKeyDead("zalo", keyIndex, COOLDOWN_ERROR);
            recordKeyOutcome("zalo", keyIndex, totalKeys, strategy, false);
            if (i < totalKeys - 1) continue;
            return Response.error("Zalo AI: " + lastError);
        }

        if (!data.data || !data.data.url) {
            lastError = "Không có đường dẫn âm thanh";
            markKeyDead("zalo", keyIndex, COOLDOWN_ERROR);
            recordKeyOutcome("zalo", keyIndex, totalKeys, strategy, false);
            if (i < totalKeys - 1) continue;
            return Response.error("Zalo AI không trả về đường dẫn âm thanh.");
        }

        var audioUrl = data.data.url;
        for (var attempt = 0; attempt < delays.length; attempt++) {
            var audioResponse = fetch(audioUrl);
            if (audioResponse && audioResponse.ok) {
                recordKeyOutcome("zalo", keyIndex, totalKeys, strategy, true);
                return Response.success(audioResponse.base64());
            }
            if (audioResponse && audioResponse.status !== 404) {
                lastError = "HTTP " + audioResponse.status;
                break;
            }
            sleep(delays[attempt]);
        }

        lastError = "Hết thời gian chờ tạo âm thanh";
        recordKeyOutcome("zalo", keyIndex, totalKeys, strategy, false);
        if (i < totalKeys - 1) continue;
    }
    if (tried === 0) return Response.error("Tất cả key Zalo AI đang trong thời gian chờ (cooldown). Thử lại sau.");
    return Response.error("Tất cả key Zalo AI đều thất bại (" + (lastError || ("HTTP " + lastStatus)) + ").");
}

function synthesizeElevenLabs(inputText, voice, credentials) {
    var strategy = getKeyStrategy();
    var modelId = getElevenLabsModel();
    if (!modelId) return Response.error("Hãy chọn một model ElevenLabs hợp lệ.");
    var lastError = "";
    var lastStatus = 0;
    var totalKeys = credentials.length;
    var startIndex = getStartIndex("elevenlabs", totalKeys, strategy);
    var tried = 0;

    // optimize_streaming_latency=3: Chế độ giảm độ trễ tối đa của ElevenLabs
    var apiUrl = "https://api.elevenlabs.io/v1/text-to-speech/" +
        encodeURIComponent(voice) +
        "?output_format=mp3_44100_128&optimize_streaming_latency=3";

    for (var i = 0; i < totalKeys; i++) {
        var keyIndex = (startIndex + i) % totalKeys;

        if (isKeyDead("elevenlabs", keyIndex)) continue;
        tried++;

        var response = fetch(apiUrl, {
            method: "POST",
            headers: {
                "xi-api-key": credentials[keyIndex],
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: inputText,
                model_id: modelId
            })
        });

        if (!response || !response.ok) {
            lastStatus = response ? response.status : 0;
            var errData = response ? parseJson(response) : null;
            var detailMsg = "";
            if (errData && errData.detail) {
                detailMsg = typeof errData.detail === "object" ? (errData.detail.message || errData.detail.status || "") : String(errData.detail);
            }
            lastError = detailMsg || ("HTTP " + lastStatus);
            markKeyDead("elevenlabs", keyIndex, getCooldownMs(lastStatus));
            recordKeyOutcome("elevenlabs", keyIndex, totalKeys, strategy, false);
            if ((isCredentialFailure(lastStatus) || lastStatus === 400) && i < totalKeys - 1) continue;
            return Response.error("ElevenLabs: " + lastError);
        }

        recordKeyOutcome("elevenlabs", keyIndex, totalKeys, strategy, true);
        return Response.success(response.base64());
    }
    if (tried === 0) return Response.error("Tất cả key ElevenLabs đang trong thời gian chờ (cooldown). Thử lại sau.");
    return Response.error("Tất cả key ElevenLabs đều thất bại (" + (lastError || ("HTTP " + lastStatus)) + ").");
}

function getElevenLabsModel() {
    var model = String(typeof elevenlabs_model !== "undefined" && elevenlabs_model ? elevenlabs_model : "eleven_multilingual_v2").trim();
    if (model.indexOf("eleven_flash_v2_5") !== -1) return "eleven_flash_v2_5";
    if (model.indexOf("eleven_turbo_v2_5") !== -1) return "eleven_turbo_v2_5";
    if (model.indexOf("eleven_v3") !== -1) return "eleven_v3";
    if (model.indexOf("eleven_multilingual_v2") !== -1) return "eleven_multilingual_v2";

    var prefix = "ElevenLabs | ";
    if (model.indexOf(prefix) === 0) {
        model = model.substring(prefix.length).trim();
    }
    var priceLabel = model.lastIndexOf(" (x");
    if (priceLabel !== -1 && model.charAt(model.length - 1) === ")") {
        model = model.substring(0, priceLabel).trim();
    }
    return model || "eleven_multilingual_v2";
}

function synthesizeFpt(inputText, voice, credentials) {
    var strategy = getKeyStrategy();
    var textToSend = inputText;
    if (textToSend.length < 3) {
        textToSend = textToSend + "...";
    }
    var lastError = "";
    var lastStatus = 0;
    var totalKeys = credentials.length;
    var startIndex = getStartIndex("fpt", totalKeys, strategy);
    var tried = 0;

    var delays = [300, 400, 500, 650, 800, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000];

    for (var i = 0; i < totalKeys; i++) {
        var keyIndex = (startIndex + i) % totalKeys;

        if (isKeyDead("fpt", keyIndex)) continue;
        tried++;

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
            markKeyDead("fpt", keyIndex, getCooldownMs(lastStatus));
            recordKeyOutcome("fpt", keyIndex, totalKeys, strategy, false);
            if (isCredentialFailure(lastStatus) && i < totalKeys - 1) continue;
            return Response.error("FPT.AI tạo giọng đọc thất bại (" + lastError + ").");
        }

        var data = parseJson(response);
        if (!data) {
            lastError = "Phản hồi không hợp lệ";
            markKeyDead("fpt", keyIndex, COOLDOWN_ERROR);
            recordKeyOutcome("fpt", keyIndex, totalKeys, strategy, false);
            if (i < totalKeys - 1) continue;
            return Response.error("FPT.AI trả về dữ liệu không hợp lệ.");
        }

        if (data.error !== 0) {
            lastError = data.message || ("Mã lỗi " + data.error);
            markKeyDead("fpt", keyIndex, COOLDOWN_ERROR);
            recordKeyOutcome("fpt", keyIndex, totalKeys, strategy, false);
            if (i < totalKeys - 1) continue;
            return Response.error("FPT.AI: " + lastError);
        }

        if (!data["as" + "ync"]) {
            lastError = "Không có đường dẫn âm thanh";
            markKeyDead("fpt", keyIndex, COOLDOWN_ERROR);
            recordKeyOutcome("fpt", keyIndex, totalKeys, strategy, false);
            if (i < totalKeys - 1) continue;
            return Response.error("FPT.AI không trả về đường dẫn âm thanh.");
        }

        var asyncUrl = data["as" + "ync"];
        for (var attempt = 0; attempt < delays.length; attempt++) {
            var audioResponse = fetch(asyncUrl);
            if (audioResponse && audioResponse.ok) {
                recordKeyOutcome("fpt", keyIndex, totalKeys, strategy, true);
                return Response.success(audioResponse.base64());
            }
            if (audioResponse && audioResponse.status !== 404) {
                lastError = "HTTP " + audioResponse.status;
                break;
            }
            sleep(delays[attempt]);
        }

        lastError = "Hết thời gian chờ tạo âm thanh";
        recordKeyOutcome("fpt", keyIndex, totalKeys, strategy, false);
        if (i < totalKeys - 1) continue;
    }
    if (tried === 0) return Response.error("Tất cả key FPT.AI đang trong thời gian chờ (cooldown). Thử lại sau.");
    if (lastError) return Response.error("Tất cả key FPT.AI đều thất bại (" + lastError + ").");
    return Response.error("Âm thanh FPT.AI chưa sẵn sàng; hãy thử lại với đoạn văn ngắn hơn.");
}

function synthesizeViettel(inputText, voice, credentials) {
    var strategy = getKeyStrategy();
    var lastError = "";
    var lastStatus = 0;
    var totalTokens = credentials.length;
    var startIndex = getStartIndex("viettel", totalTokens, strategy);
    var tried = 0;

    for (var i = 0; i < totalTokens; i++) {
        var keyIndex = (startIndex + i) % totalTokens;

        if (isKeyDead("viettel", keyIndex)) continue;
        tried++;

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
            markKeyDead("viettel", keyIndex, getCooldownMs(lastStatus));
            recordKeyOutcome("viettel", keyIndex, totalTokens, strategy, false);
            if (isCredentialFailure(lastStatus) && i < totalTokens - 1) continue;
            return Response.error("Viettel AI tạo giọng đọc thất bại (" + lastError + ").");
        }

        var contentType = String(response.header("Content-Type") || "").toLowerCase();
        if (contentType.indexOf("json") !== -1) {
            var data = parseJson(response);
            var msg = (data && (data.message || data.error || data.status)) ? (data.message || data.error || ("Lỗi " + data.status)) : "Lỗi phản hồi JSON";
            lastError = msg;
            markKeyDead("viettel", keyIndex, COOLDOWN_ERROR);
            recordKeyOutcome("viettel", keyIndex, totalTokens, strategy, false);
            if (i < totalTokens - 1) continue;
            return Response.error("Viettel AI: " + msg);
        }

        recordKeyOutcome("viettel", keyIndex, totalTokens, strategy, true);
        return Response.success(response.base64());
    }
    if (tried === 0) return Response.error("Tất cả token Viettel AI đang trong thời gian chờ (cooldown). Thử lại sau.");
    return Response.error("Tất cả token Viettel AI đều thất bại (" + (lastError || ("HTTP " + lastStatus)) + ").");
}