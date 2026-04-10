function execute(page, input) {
    var query = input || "";
    if (!query) return Response.success([]);

    var encoded = java.net.URLEncoder.encode(query, "UTF-8");
    var url = BASE_URL + "/?s=" + encoded + "&post_type=wp-manga";

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Search error");

    var doc = res.parse();

    // Try parseCards first
    var items = parseCards(doc);

    // If no results from parseCards, try search result selectors
    if (items.length === 0) {
        var results = doc.select(".c-tabs-item .row, .search-wrap .row, .tab-content-wrap .c-tabs-item__content");
        for (var i = 0; i < results.size(); i++) {
            var row = results.get(i);
            var titleA = selFirst(row, ".post-title a, h3 a, h4 a");
            if (!titleA) continue;

            var title = titleA.text().trim();
            var href = titleA.attr("href") || "";
            if (!title || !href) continue;

            var cover = extractCover(row);

            items.push({
                title: title,
                url: href,
                cover: cover
            });
        }
    }

    // Check for next page
    var hasNext = false;
    var nextLinks = doc.select("a.nextpostslink, a.next, .nav-previous a");
    if (nextLinks.size() > 0) hasNext = true;

    var result = {
        list: items,
        hasNext: hasNext
    };

    return Response.success(result);
}
