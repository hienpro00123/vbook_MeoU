load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var searchUrl = BASE_URL + "/search/" + encodeURIComponent(key) + "/";
    if (p > 1) searchUrl = BASE_URL + "/search/" + encodeURIComponent(key) + "/page/" + p + "/";
    var doc = fetchDoc(searchUrl);
    if (!doc) return Response.error("");
    var items = parseSearchList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var nextLink = selFirst(doc, ".uk-pagination a[rel='next'], a.next");
    var next = nextLink ? String(p + 1) : null;
    return Response.success(items, next);
}
