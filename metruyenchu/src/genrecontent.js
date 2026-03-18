load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/the-loai/" + url + "?page=" + p;
    var res = fetchRetry(fetchUrl);
    if (!res.ok) return Response.error("Không tải được thể loại: " + url);
    var doc = res.html();
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
