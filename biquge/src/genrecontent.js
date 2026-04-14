load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl;
    if (p <= 1) {
        fetchUrl = BASE_URL + "/sort/" + url + "/";
    } else {
        fetchUrl = BASE_URL + "/sort/" + url + "/" + p + ".html";
    }
    var doc = fetchBrowserFast(fetchUrl);
    if (!doc) return Response.error("");
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var nextLink = selFirst(doc, "a:contains(下一页)");
    var next = nextLink ? String(p + 1) : null;
    return Response.success(items, next);
}
