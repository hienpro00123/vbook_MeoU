var CHAPTER_CACHE_KEY = "dich_deepseek_chapter_cache_v1";
var CHAPTER_CACHE_MAX_CHARS = 1000000;
var CHAPTER_CACHE_MAX_ENTRIES = 200;

function chapterCacheRead() {
    var raw = localStorage.getItem(CHAPTER_CACHE_KEY);
    if (raw === null || raw === undefined || String(raw) === "") return [];
    var entries = JSON.parse(String(raw));
    if (!Array.isArray(entries)) throw new Error("Dữ liệu cache chương không hợp lệ");
    return entries;
}

function chapterCacheGet(key) {
    try {
        var entries = chapterCacheRead();
        for (var i = entries.length - 1; i >= 0; i--) {
            if (entries[i] && entries[i].key === key && typeof entries[i].text === "string" &&
                entries[i].text.trim()) return entries[i].text;
        }
    } catch (e) {
        Log.log("[dich_deepseek] Không thể đọc cache chương: " + String(e));
    }
    return "";
}

function chapterCacheSave(key, text) {
    try {
        var entries = chapterCacheRead();
        for (var i = entries.length - 1; i >= 0; i--) {
            if (entries[i] && entries[i].key === key) entries.splice(i, 1);
        }
        entries.push({ key: key, text: text });
        var serialized = JSON.stringify(entries);
        while (entries.length > 1 &&
            (entries.length > CHAPTER_CACHE_MAX_ENTRIES || serialized.length > CHAPTER_CACHE_MAX_CHARS)) {
            entries.shift();
            serialized = JSON.stringify(entries);
        }
        if (serialized.length > CHAPTER_CACHE_MAX_CHARS) {
            Log.log("[dich_deepseek] Đoạn dịch quá lớn để lưu vào cache chương.");
            return;
        }
        localStorage.setItem(CHAPTER_CACHE_KEY, serialized);
    } catch (e) {
        Log.log("[dich_deepseek] Không thể lưu cache chương: " + String(e));
    }
}
