load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = p <= 1 ? url : url + "?page=" + p;

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang");
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseListItems(doc);
    if (!items || items.length === 0) return Response.success([], null);

    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
