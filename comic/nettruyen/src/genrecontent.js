load("config.js");

function execute(slug, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = p <= 1
        ? BASE_URL + "/tim-truyen/" + slug
        : BASE_URL + "/tim-truyen/" + slug + "?page=" + p;

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.error("Không tải được thể loại");
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseListItems(doc);
    if (!items || items.length === 0) return Response.success([], null);

    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
