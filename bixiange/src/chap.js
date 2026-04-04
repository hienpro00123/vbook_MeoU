load("config.js");

// Các selector nội dung chương — thử theo thứ tự ưu tiên
var CHAP_CSS = "#content, .content, #BookText, #chaptercontent, .chaptercontent, " +
    ".read-content, .reading-content, .chapter-content, " +
    "#article-content, .article-content, .story-content, " +
    "article, main";

function findContent(doc) {
    var el = selFirst(doc, CHAP_CSS);
    if (el) {
        var txt = stripHtml(el.html());
        if (txt.length > 200) return txt;
    }
    // Fallback: div có text dài nhất, dừng sớm khi > 5000
    var divs = doc.select("div");
    var best = null;
    var bestLen = 200;
    for (var i = 0; i < divs.size(); i++) {
        var d = divs.get(i);
        var len = d.text().length;
        if (len > bestLen) { bestLen = len; best = d; if (len > 5000) break; }
    }
    return best ? stripHtml(best.html()) : "";
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var content = "";

    // Fast path: HTTP fetch
    var res = fetchRetry(chapUrl);
    if (res && res.ok) {
        var doc = res.html();
        if (doc) content = findContent(doc);
    }

    // Slow path: browser — chỉ khi HTTP trả về rỗng hoàn toàn
    if (!content) {
        var doc2 = fetchBrowser(chapUrl);
        if (doc2) content = findContent(doc2);
    }

    if (!content || content.length < 50) return Response.error("Không tìm thấy nội dung chương");
    return Response.success(content);
}
