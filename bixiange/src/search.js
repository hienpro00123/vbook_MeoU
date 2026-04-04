load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    // fetchBrowser tu xu ly GBK encoding (fetch POST bi mojibake)
    var searchUrl = BASE_URL + "/search/?keyword=" + encodeURIComponent(key);
    if (p > 1) searchUrl += "&page=" + p;
    var doc = fetchBrowser(searchUrl);
    if (!doc) return Response.error("Loi tim kiem");
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
