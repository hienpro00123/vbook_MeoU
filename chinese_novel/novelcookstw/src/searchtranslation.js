var NOVEL_SEARCH_ALIAS_MAP = {
    "dau pha thuong khung": "斗破苍穹",
    "pham nhan tu tien": "凡人修仙传",
    "tien nghich": "仙逆",
    "dai chua te": "大主宰",
    "vo dong can khon": "武动乾坤",
    "the gioi hoan my": "完美世界",
    "than mo": "神墓",
    "toan chuc phap su": "全职法师",
    "tinh than bien": "星辰变",
    "nguyen ton": "元尊",
    "nhat niem vinh hang": "一念永恒",
    "quy bi chi chu": "诡秘之主",
    "toan chuc cao thu": "全职高手",
    "tru tien": "诛仙",
    "kiem lai": "剑来",
    "de ba": "帝霸",
    "dau la dai luc": "斗罗大陆",
    "vo luyen dinh phong": "武炼巅峰",
    "van co than de": "万古神帝",
    "than an vuong toa": "神印王座",
    "tu la vo than": "修罗武神"
};
var NOVEL_SEARCH_TRANSLATION_TTL = 300000;
var NOVEL_SEARCH_TRANSLATION_ERROR_TTL = 30000;
var NOVEL_SEARCH_TRANSLATION_RETRY_TTL = 10000;
var NOVEL_SEARCH_TRANSLATION_TIMEOUT = 8000;

function novelSearchNormalize(text) {
    return String(text || "").toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
        .replace(/[èéẹẻẽêềếệểễ]/g, "e")
        .replace(/[ìíịỉĩ]/g, "i")
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
        .replace(/[ùúụủũưừứựửữ]/g, "u")
        .replace(/[ỳýỵỷỹ]/g, "y")
        .replace(/đ/g, "d")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function novelSearchIsVietnamese(text) {
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
        return true;
    }
    return /(^|\s)(tim kiem truyen|tim truyen|doc truyen|tim kiem|truyen|doc|tac gia|the loai|tieu thuyet|chuong|hoan thanh|dang ra|xuyen khong)(\s|$)/.test(novelSearchNormalize(text));
}

function novelSearchResolveQuery(text) {
    var key = novelSearchNormalize(text);
    var alias = novelSearchFindAlias(key);
    if (alias) return { query: alias };
    if (!novelSearchIsVietnamese(text)) return { query: text };

    var translationText = novelSearchPrepareTranslation(text);
    var translationKey = novelSearchNormalize(translationText);
    if (translationText.length > 100) return { error: "Từ khóa tiếng Việt quá dài để dịch" };

    var cacheKey = "novelcookstw:search-translation:" + encodeURIComponent(translationKey);
    try {
        var cached = parseJson(cacheStorage.getItem(cacheKey));
        if (cached && cached.expires > Date.now()) {
            if (cached.query) return { query: cached.query };
            if (cached.error) return { error: cached.error };
        }
    } catch (e) {
        if (typeof Log !== "undefined") Log.log("NovelCooksTW translation cache read failed: " + e);
    }

    var cooldownKey = "novelcookstw:search-translation:google-429";
    try {
        var cooldown = parseJson(cacheStorage.getItem(cooldownKey));
        if (cooldown && cooldown.expires > Date.now()) {
            return { error: "Google Translate đang giới hạn yêu cầu (HTTP 429). Thử lại sau hoặc tìm bằng tên tiếng Trung." };
        }
    } catch (e2) {
        if (typeof Log !== "undefined") Log.log("NovelCooksTW translation cooldown read failed: " + e2);
    }

    var transientCooldownKey = "novelcookstw:search-translation:google-transient";
    try {
        var transientCooldown = parseJson(cacheStorage.getItem(transientCooldownKey));
        if (transientCooldown && transientCooldown.expires > Date.now()) {
            return { error: "Google Translate đang tạm lỗi kết nối. Thử lại sau hoặc tìm bằng tên tiếng Trung." };
        }
    } catch (e3) {
        if (typeof Log !== "undefined") Log.log("NovelCooksTW transient cooldown read failed: " + e3);
    }

    var translated = novelSearchTranslateWithGoogle(translationText);
    if (translated.error && translated.error.indexOf("HTTP 429") >= 0) {
        translated.error = "Google Translate đang giới hạn yêu cầu (HTTP 429). Thử lại sau hoặc tìm bằng tên tiếng Trung.";
        try {
            cacheStorage.setItem(cooldownKey, JSON.stringify({
                expires: Date.now() + NOVEL_SEARCH_TRANSLATION_ERROR_TTL
            }));
        } catch (e4) {
            if (typeof Log !== "undefined") Log.log("NovelCooksTW translation cooldown write failed: " + e4);
        }
    } else if (translated.error && (translated.status === 0 || translated.status >= 500)) {
        try {
            cacheStorage.setItem(transientCooldownKey, JSON.stringify({
                expires: Date.now() + NOVEL_SEARCH_TRANSLATION_RETRY_TTL
            }));
        } catch (e5) {
            if (typeof Log !== "undefined") Log.log("NovelCooksTW transient cooldown write failed: " + e5);
        }
    }
    try {
        if (translated.query) {
            cacheStorage.setItem(cacheKey, JSON.stringify({
                expires: Date.now() + NOVEL_SEARCH_TRANSLATION_TTL,
                query: translated.query
            }));
        } else if (translated.error) {
            var errorTtl = translated.error.indexOf("HTTP 429") >= 0
                ? NOVEL_SEARCH_TRANSLATION_ERROR_TTL
                : NOVEL_SEARCH_TRANSLATION_RETRY_TTL;
            cacheStorage.setItem(cacheKey, JSON.stringify({
                expires: Date.now() + errorTtl,
                error: translated.error
            }));
        }
    } catch (e6) {
        if (typeof Log !== "undefined") Log.log("NovelCooksTW translation cache write failed: " + e6);
    }
    return translated;
}

function novelSearchPrepareTranslation(text) {
    var value = String(text || "").trim();
    for (var i = 0; i < 3; i++) {
        var trimmed = value
            .replace(/^(tìm kiếm truyện|tim kiem truyen|tìm truyện|tim truyen|đọc truyện|doc truyen|tìm kiếm|tim kiem|tìm|tim|đọc|doc)\s+/i, "")
            .replace(/\s+(truyện\s+(full|hoàn thành|hoan thanh|hay nhất|hay nhat|mới nhất|moi nhat)|full|hoàn thành|hoan thanh|hay nhất|hay nhat|mới nhất|moi nhat)$/i, "")
            .trim();
        if (trimmed === value) break;
        value = trimmed;
    }
    return value || String(text || "").trim();
}

function novelSearchFindAlias(key) {
    var alias = NOVEL_SEARCH_ALIAS_MAP[key];
    if (alias) return alias;

    var titleKey = key;
    for (var i = 0; i < 3; i++) {
        var trimmed = titleKey
            .replace(/^(tim kiem truyen|tim truyen|doc truyen|tim kiem|tim|doc|truyen)\s+/, "")
            .replace(/\s+(truyen|full|hoan thanh|hoan|hay nhat|hay|moi)$/, "")
            .trim();
        if (trimmed === titleKey) break;
        titleKey = trimmed;
    }
    return NOVEL_SEARCH_ALIAS_MAP[titleKey] || "";
}

function novelSearchTranslateWithGoogle(text) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=zh-CN&dt=t&q=" +
        encodeURIComponent(text);
    var response = null;
    try {
        response = fetch(url, { timeout: NOVEL_SEARCH_TRANSLATION_TIMEOUT });
    } catch (e) {
        return { error: "Không kết nối được Google Translate: " + e, status: 0 };
    }
    if (!response || !response.ok) {
        return {
            error: "Google Translate trả HTTP " + (response ? response.status : 0),
            status: response ? response.status : 0
        };
    }

    var data;
    try {
        data = response.json();
    } catch (e2) {
        return { error: "Không đọc được phản hồi từ Google Translate", status: response.status };
    }
    var translated = "";
    var segments = data && data[0];
    if (segments && segments.length) {
        for (var i = 0; i < segments.length; i++) {
            if (segments[i] && segments[i][0]) translated += String(segments[i][0]);
        }
    }
    translated = translated.trim();
    if (/[\u3400-\u9fff]/.test(translated)) return { query: translated };
    return { error: "Google Translate không trả về từ khóa tiếng Trung", status: response.status };
}
