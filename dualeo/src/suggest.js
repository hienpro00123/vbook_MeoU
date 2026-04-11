load("config.js");

function execute(url) {
    var detailUrl = resolveUrl(url);
    var doc = fetch(detailUrl);
    if (!doc) return Response.success([]);

    var tagLink = selFirst(doc, "a[href*='/the-loai/']");
    if (tagLink) {
        var genreUrl = resolveUrl(tagLink.attr("href") || "");
        if (genreUrl) {
            var genreDoc = fetch(genreUrl);
            if (genreDoc) {
                var items = parseList(genreDoc);
                return Response.success(items || []);
            }
        }
    }
    return Response.success([]);
}
