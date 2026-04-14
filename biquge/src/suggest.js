load("config.js");

function execute(url) {
    var bookUrl = resolveUrl(url);
    var doc = fetchBrowserFast(bookUrl);
    if (!doc) return Response.success([]);

    var items = parseList(doc);
    var result = [];
    for (var i = 0; i < items.length; i++) {
        var link = items[i].link;
        if (link !== url && link !== bookUrl) {
            result.push(items[i]);
        }
    }
    return Response.success(result);
}
