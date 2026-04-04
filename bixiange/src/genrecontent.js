load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = paginateUrl(url, p);
    var res = fetchRetry(fetchUrl);
    if (!res.ok) return Response.error("Lỗi tải thể loại: " + url);
    var doc = res.html();
    if (!doc) return Response.error("Lỗi tải thể loại: " + url);
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
