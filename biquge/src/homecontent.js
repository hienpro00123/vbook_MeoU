load("config.js");

var TOP_ROUTES = {
    "allvisit": "/top/allvisit/",
    "weekvisit": "/top/weekvisit/",
    "postdate": "/top/postdate/",
    "lastupdate": "/top/lastupdate/"
};

function execute(url, page) {
    if (TOP_ROUTES[url]) {
        var topDoc = fetchBrowserFast(BASE_URL + TOP_ROUTES[url]);
        if (!topDoc) return Response.error("");
        var topItems = parseList(topDoc);
        return Response.success(topItems || [], null);
    }

    var doc = fetchBrowserFast(BASE_URL + "/");
    if (!doc) return Response.error("");

    var css = ".list-" + url;
    var section = selFirst(doc, css);
    var source = section || doc;
    var items = parseList(source);
    return Response.success(items, null);
}
