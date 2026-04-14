load("config.js");

function execute(url, page) {
    var doc = fetchBrowserFast(BASE_URL + "/");
    if (!doc) return Response.error("");

    var css = ".list-" + url;
    var section = selFirst(doc, css);
    var source = section || doc;
    var items = parseList(source);
    return Response.success(items, null);
}
