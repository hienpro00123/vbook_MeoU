var BASE_URL = "https://novel.cooks.tw";
var API_BASE = BASE_URL + "/api";

// Fetch JSON từ API endpoint
function fetchApi(path) {
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    var url = API_BASE + path + sep + "lang=zh-TW";
    var res = fetch(url);
    if (!res || !res.ok) return null;
    return JSON.parse(res.body);
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
