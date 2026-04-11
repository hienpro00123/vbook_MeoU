load("config.js");

function execute(url) {
    var bookUrl = resolveUrl(url);
    var doc = fetchBrowser(bookUrl, 8000);
    if (!doc) return Response.error("");

    var bookId = "";
    var m = BOOK_RE.exec(bookUrl);
    if (m) bookId = m[1];

    var chapters = [];
    var seen = {};

    // Try multiple selectors for chapter links
    var chapLinks = doc.select(".booklist a[href], #list a[href], .listmain a[href]");
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        // Only accept chapter links for this book (/book/{id}/{chap}.html)
        if (bookId && href.indexOf("/book/" + bookId + "/") === -1) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        if (seen[href]) continue;
        var cname = a.text().trim();
        if (!cname || cname.length < 2) continue;
        seen[href] = true;
        chapters.push({ name: cname, url: href, host: HOST });
    }

    if (chapters.length === 0) return Response.error("");
    return Response.success(chapters);
}
