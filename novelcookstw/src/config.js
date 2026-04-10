var BASE_URL = "https://novel.cooks.tw";
var API_BASE = BASE_URL + "/api";

// Fetch JSON từ API endpoint
function fetchApi(path) {
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    var url = API_BASE + path + sep + "lang=zh-TW";
    var res = fetch(url);
    if (res && res.ok) { try { return res.json(); } catch(e) {} }
    res = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
            "Accept": "application/json"
        }
    });
    if (!res || !res.ok) return null;
    try { return res.json(); } catch(e) { return null; }
}

// Tính URL cover từ articleid
function coverUrl(id) {
    var n = parseInt(id);
    var group = Math.floor(n / 1000);
    return "https://pic.cooks.tw/" + group + "/" + n + "/" + n + "s.jpg";
}

// Tạo URL chapter để truyền vào chap.js
function makeChapUrl(articleId, chapterId) {
    return BASE_URL + "/reader.html?articleid=" + articleId + "&chapterid=" + chapterId;
}

// Trích articleid từ URL detail (novel.html?articleid=XXX)
function parseArticleId(url) {
    var m = url.match(/[?&]articleid=(\d+)/);
    return m ? m[1] : null;
}

// Trích chapterid từ URL chapter (reader.html?...&chapterid=XXX)
function parseChapterId(url) {
    var m = url.match(/[?&]chapterid=(\d+)/);
    return m ? m[1] : null;
}

// Chuyển nội dung text thuần thành HTML với paragraph
function textToHtml(text) {
    if (!text) return "";
    // Trim whitespace đầu mỗi dòng, chia theo \r\n hoặc \n
    var lines = text.split(/\r?\n/);
    var parts = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace(/^\s+/, "");
        if (line.length > 0) parts.push("<p>" + line + "</p>");
    }
    return parts.join("\n");
}
