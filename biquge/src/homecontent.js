load("config.js");

var SORT_MAP = {
    "index-1": "xuanhuan",
    "index-2": "dushi",
    "index-3": "lishi"
};

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    if (p <= 1) {
        var doc = fetchBrowserFast(BASE_URL + "/");
        if (!doc) return Response.error("无法加载首页列表");
        var css = ".list-" + url;
        var section = selFirst(doc, css);
        var source = section || doc;
        var items = parseList(source);
        return Response.success(items, items.length > 0 ? "2" : null);
    }
    var genre = SORT_MAP[url] || "xuanhuan";
    var sortUrl = BASE_URL + "/sort/" + genre + "/" + (p - 1) + ".html";
    var sortDoc = fetchBrowserFast(sortUrl);
    if (!sortDoc) return Response.success([], null);
    var items = parseList(sortDoc);
    if (!items || items.length === 0) return Response.success([], null);
    var nextLink = selFirst(sortDoc, "a:contains(下一页)");
    var next = nextLink ? String(p + 1) : null;
    return Response.success(items, next);
}
