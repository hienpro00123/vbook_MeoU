load("config.js");

function execute(url) {
    var bookUrl = resolveUrl(url);
    var doc = fetchBrowserFast(bookUrl);
    if (!doc) return Response.success([]);

    var tagLink = selFirst(doc, ".book-tag a[href*='/sort/'], a[href*='/sort/']");
    if (tagLink) {
        var genreUrl = resolveUrl(tagLink.attr("href") || "");
        if (genreUrl) {
            var genreDoc = fetchBrowserFast(genreUrl);
            if (genreDoc) {
                var items = parseList(genreDoc);
                return Response.success(items || []);
            }
        }
    }
    return Response.success([]);
}
