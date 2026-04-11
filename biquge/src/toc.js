load("config.js");

var SKIP_RE = /^(查看全部|全部章节|展开|收起|更多|目录|上一页|下一页)$/;

function extractChaps(doc, bookId) {
    var chapters = [];
    var seen = {};
    var chapLinks = doc.select(".booklist a[href], #list a[href], .listmain a[href], .chapter-list a[href]");
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        if (bookId && href.indexOf("/book/" + bookId + "/") === -1) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        if (seen[href]) continue;
        var cname = a.text().trim();
        if (!cname || cname.length < 2) continue;
        if (SKIP_RE.test(cname)) continue;
        seen[href] = true;
        chapters.push({ name: cname, url: href, host: HOST });
    }
    return chapters;
}

function execute(url) {
    var bookUrl = resolveUrl(url);
    var bookId = "";
    var m = BOOK_RE.exec(bookUrl);
    if (m) bookId = m[1];

    // Always load full chapter list page first: /book/{id}/
    var chapters = [];
    if (bookId) {
        var fullUrl = BASE_URL + "/book/" + bookId + "/";
        var fullDoc = fetchBrowser(fullUrl, 10000);
        if (fullDoc) chapters = extractChaps(fullDoc, bookId);
    }

    // Fallback to detail page if full page failed
    if (chapters.length === 0) {
        var doc = fetchBrowser(bookUrl, 10000);
        if (!doc) return Response.error("");
        chapters = extractChaps(doc, bookId);
    }

    if (chapters.length === 0) return Response.error("");
    return Response.success(chapters);
}
