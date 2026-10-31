load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/theloai/" + url + "/page/" + p + "/";

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.success([], null);
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseListItems(doc);

    var next = items.length > 0 ? String(p + 1) : null;
    return Response.success(items, next);
}
