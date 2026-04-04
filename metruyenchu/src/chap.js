load("config.js");

// Selector nội dung chương — ưu tiên .truyen (metruyenchu) trước các selector phổ biến
var CHAP_CSS = ".truyen, #chapter-content, .chapter-content, .content-chapter, " +
    "#truyen-content, .truyen-content, .reading-content, " +
    ".content-text, .text-content, #noi-dung, .noi-dung, " +
    ".box-reading, .box-chapter, .container-reading, " +
    ".story-content, .text-story";

function findContent(doc) {
    var el = selFirst(doc, CHAP_CSS);
    if (el) {
        var txt = stripHtml(el.html());
        if (txt.length > 100) return txt;
    }
    // Fallback: div có text dài nhất, dừng sớm khi > 5000
    var divs = doc.select("div[class], div[id]");
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

    // Fast path: HTTP fetch (hash URLs từ TOC có nội dung trong static HTML)
    var content = "";
    var res = fetchRetry(chapUrl);
    if (res && res.ok) {
        var doc = res.html();
        if (doc) content = findContent(doc);
    }

    // Slow path: browser (no-hash URLs hoặc trang cần JS render)
    if (content.length < 100) {
        var doc2 = fetchBrowser(chapUrl);
        if (doc2) content = findContent(doc2);
    }

    if (!content || content.length < 50) return Response.error("Không tìm thấy nội dung chương");
    return Response.success(content);
}
