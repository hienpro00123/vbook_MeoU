load("config.js");

function execute(input, page) {
    if (input.indexOf("author:") !== 0) return Response.success([], null);

    var p = page ? parseInt(page) : 1;
    var authorName = decodeURIComponent(input.substring(7));
    var fetchUrl = BASE_URL + "/tac-gia?name=" + encodeURIComponent(authorName) + "&page=" + p;

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.success([], null);
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = [];
    var cards = doc.select(".comic-item");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var a = selFirst(card, "a[href*='/truyen/']");
        if (!a) continue;
        var href = a.attr("href") || "";
        var slug = extractSlug(href);
        if (!slug) continue;

        var img = selFirst(card, "img");
        var cover = img ? resolveCover(img.attr("src") || "") : "";

        var titleEl = selFirst(card, "h3");
        var name = titleEl ? titleEl.text().trim() : (img ? img.attr("alt").trim() : "");
        if (!name) continue;

        items.push({
            name: adultName(name),
            cover: cover,
            link: BASE_URL + "/truyen/" + slug,
            host: HOST
        });
    }

    var next = null;
    var nextPage = String(p + 1);
    var pageLinks = doc.select(".pagination .pagination-number a[href]");
    for (var j = 0; j < pageLinks.size(); j++) {
        var ph = pageLinks.get(j).attr("href") || "";
        if (ph.indexOf("page=" + nextPage) >= 0) {
            next = nextPage;
            break;
        }
    }

    return Response.success(items, next);
}
