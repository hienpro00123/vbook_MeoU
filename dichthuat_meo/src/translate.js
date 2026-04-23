// Vietphrase Meo Translate
// Tu dien: name_dict.js (ten rieng), uuhoadich_dict.js (cum tu), vietphrase_dict.js (tu don)
// Moi tu dien la mang [[key, value], ...]
// -> khi load se sap xep tang dan theo do dai key, roi ap dung nguoc (dai truoc, ngan sau)

load("language_list.js");
load("name_dict.js");
load("uuhoadich_dict.js");
load("vietphrase_dict.js");

var NAME_DICT_INDEX = buildDictIndex(nameDict);
var UUHOADICH_DICT_INDEX = buildDictIndex(uuhoadichDict);
var VIETPHRASE_DICT_INDEX = buildDictIndex(vietphraseDict);

function execute(text, from, to, apiKey) {
    var sourceLanguage = normalizeLanguageId(from);
    var targetLanguage = normalizeLanguageId(to);
    if (sourceLanguage === "zh-Hant") return Response.error("zh-Hant is not supported yet");
    if (sourceLanguage !== "" && sourceLanguage !== "zh") return Response.error("Only Chinese source text is supported");
    if (targetLanguage !== "" && targetLanguage !== "vi") return Response.error("Only Vietnamese output is supported");
    if (!text || text.length === 0) return Response.success("");
    var result = applyAll(text);
    return Response.success(result);
}

function normalizeLanguageId(languageId) {
    if (!languageId) return "";
    var normalized = String(languageId).toLowerCase();
    if (normalized === "zh" || normalized === "zh-hans" || normalized === "zh-cn" || normalized === "zh_sg") {
        return "zh";
    }
    if (normalized === "zh-hant" || normalized === "zh-tw" || normalized === "zh-hk" || normalized === "zh-mo") {
        return "zh-Hant";
    }
    if (normalized === "vi" || normalized === "vi-vn" || normalized === "vi_vn") {
        return "vi";
    }
    return normalized;
}

// ap dung ca 3 tu dien theo thu tu: ten rieng -> cum tu -> tu don
// trong moi tu dien, key dai hon se duoc uu tien truoc.
function applyAll(text) {
    text = applyDict(text, NAME_DICT_INDEX);
    text = applyDict(text, UUHOADICH_DICT_INDEX);
    text = applyDict(text, VIETPHRASE_DICT_INDEX);
    return text;
}

function buildDictIndex(dict) {
    var entries = [];
    for (var i = 0; i < dict.length; i++) {
        var key = dict[i][0];
        var val = dict[i][1];
        var firstChar = key.charAt(0);
        entries.push([
            key,
            val,
            firstChar,
            isAsciiChar(firstChar),
            hasCjkChar(val) && val !== key,
            key.length,
            i
        ]);
    }
    entries.sort(compareDictEntries);
    return entries;
}

function compareDictEntries(a, b) {
    if (a[5] !== b[5]) {
        return a[5] - b[5];
    }
    return a[6] - b[6];
}

// ap dung mot tu dien: duyet nguoc (dai truoc) de tranh thay the nham
// chi scan day du voi key ASCII; key CJK se bi bo qua neu ky tu dau tien
// khong co mat trong text hien tai.
function applyDict(text, dictIndex) {
    var cjkChars = collectCjkChars(text);
    for (var i = dictIndex.length - 1; i >= 0; i--) {
        var entry = dictIndex[i];
        if (!entry[3] && !cjkChars[entry[2]]) {
            continue;
        }
        var key = entry[0];
        var val = entry[1];
        if (text.indexOf(key) !== -1) {
            text = replaceAll(text, key, val);
            if (entry[4]) {
                cjkChars = collectCjkChars(text);
            }
        }
    }
    return text;
}

function collectCjkChars(text) {
    var map = {};
    for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (hasCjkChar(ch)) {
            map[ch] = true;
        }
    }
    return map;
}

function hasCjkChar(text) {
    if (!text || text.length === 0) return false;
    for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i);
        if ((code >= 13312 && code <= 40959) || (code >= 63744 && code <= 64255)) {
            return true;
        }
    }
    return false;
}

function isAsciiChar(ch) {
    return ch && ch.length > 0 && ch.charCodeAt(0) < 128;
}

// thay the toan bo (khong dung regex de tranh loi ky tu dac biet)
function replaceAll(str, find, replace) {
    return str.split(find).join(replace);
}
