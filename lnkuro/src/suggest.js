function execute(input) {
    var query = input || "";
    if (!query) return Response.success([]);

    var encoded = java.net.URLEncoder.encode(query, "UTF-8");
    var url = BASE_URL + "/?s=" + encoded + "&post_type=wp-manga";

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.success([]);

    var doc = res.parse();

    var items = parseCards(doc);

    // Fallback search results
    if (items.length === 0) {
        var results = doc.select(".c-tabs-item .row, .search-wrap .row, .tab-content-wrap .c-tabs-item__content");
        for (var i = 0; i < results.size(); i++) {
            var row = results.get(i);
            var titleA = selFirst(row, ".post-title a, h3 a, h4 a");
            if (!titleA) continue;

            var title = titleA.text().trim();
            var href = titleA.attr("href") || "";
            if (!title || !href) continue;

            items.push({
                title: title,
                url: href,
                cover: ""
            });
        }
    }

    return Response.success(items);
}
