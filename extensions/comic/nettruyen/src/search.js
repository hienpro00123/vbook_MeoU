load("config.js");

function execute(keyword, page) {
    var p = page ? parseInt(page) : 1;
    var q = encodeURIComponent(keyword);
    var fetchUrl = p <= 1
        ? BASE_URL + "/tim-truyen?keyword=" + q
        : BASE_URL + "/tim-truyen?keyword=" + q + "&page=" + p;

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.success([], null);
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseListItems(doc);
    if (!items || items.length === 0) return Response.success([], null);

    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
