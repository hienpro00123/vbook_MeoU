load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var searchUrl = BASE_URL + "/search/?searchkey=" + encodeURIComponent(key);
    if (p > 1) searchUrl += "&page=" + p;
    var doc = fetchBrowserFast(searchUrl);
    if (!doc) return Response.error("无法加载搜索结果");
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var nextLink = selFirst(doc, "a:contains(下一页)");
    var next = nextLink ? String(p + 1) : null;
    return Response.success(items, next);
}
