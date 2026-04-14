load("config.js");

function execute(url) {
    var bookUrl = resolveUrl(url);
    var doc = fetchBrowserFast(bookUrl);
    if (!doc) return Response.success([]);

    var items = parseList(doc);
    var m = url.match(/\/book\/(\d+)/);
    var bookId = m ? m[1] : "";
    var result = [];
    for (var i = 0; i < items.length; i++) {
        var link = items[i].link;
        if (bookId && link.indexOf("/book/" + bookId) !== -1) continue;
        result.push(items[i]);
    }
    return Response.success(result);
}
