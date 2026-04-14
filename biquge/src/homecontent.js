load("config.js");

var TOP_ROUTES = {
    "allvisit": "/top/allvisit/",
    "monthvisit": "/top/monthvisit/",
    "weekvisit": "/top/weekvisit/",
    "dayvisit": "/top/dayvisit/",
    "postdate": "/top/postdate/",
    "lastupdate": "/top/lastupdate/"
};

function execute(url, page) {
    if (TOP_ROUTES[url]) {
        var p = page ? parseInt(page) : 1;
        var topUrl = BASE_URL + TOP_ROUTES[url];
        if (p > 1) topUrl = BASE_URL + TOP_ROUTES[url] + p + "/";
        var topDoc = fetchBrowserFast(topUrl);
        if (!topDoc) return Response.error("");
        var topItems = parseList(topDoc);
        if (!topItems || topItems.length === 0) return Response.success([], null);
        var topNext = selFirst(topDoc, "a:contains(下一页)");
        return Response.success(topItems, topNext ? String(p + 1) : null);
    }

    var doc = fetchBrowserFast(BASE_URL + "/");
    if (!doc) return Response.error("");

    var css = ".list-" + url;
    var section = selFirst(doc, css);
    var source = section || doc;
    var items = parseList(source);
    return Response.success(items, null);
}
