load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/search/?keyword=" + encodeURIComponent(key);
    if (p > 1) fetchUrl += "&page=" + p;
    var res = fetchRetry(fetchUrl);
    if (!res.ok) return Response.error("Lỗi tìm kiếm");
    var doc = res.html();
    if (!doc) return Response.error("Lỗi tìm kiếm");
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
