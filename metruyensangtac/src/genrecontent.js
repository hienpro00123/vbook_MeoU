load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/index.php?quanly=truyen&theloai=" + url;
    if (p > 1) fetchUrl += "&page=" + p;

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.error("Không tải được thể loại");
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = [];
    var seen = {};

    // Parse story cards from genre listing
    var storyLinks = doc.select("a[href*='/truyen/']");
    for (var i = 0; i < storyLinks.size(); i++) {
        var a = storyLinks.get(i);
        var href = a.attr("href") || "";
        if (href.indexOf("/truyen/index.php") !== -1) continue;

        var slug = extractSlug(href);
        if (!slug || seen[slug]) continue;

        var name = a.text().trim();
        if (!name || name === "Logo" || name === "Xem thêm" || name.length < 2) continue;
        if (name.indexOf("Banner") !== -1) continue;

        seen[slug] = true;

        var cover = "";
        var img = selFirst(a, "img");
        if (img) {
            cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
            if (cover.indexOf("logo") !== -1) cover = "";
        }
        if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;

        // Try to get author from nearby element
        var desc = "";
        var parent = a.parent();
        if (parent) {
            var authorEl = selFirst(parent, "span, small, .author");
            if (authorEl) desc = authorEl.text().trim();
        }

        items.push({
            name: name,
            link: "/truyen/" + slug,
            host: HOST,
            cover: cover,
            description: desc
        });
        if (items.length >= 30) break;
    }

    if (!items || items.length === 0) return Response.success([], null);

    // Next page
    var next = null;
    var nextLink = selFirst(doc, "a:matchesOwn(Next), a:matchesOwn(next), a:matchesOwn(»)");
    if (nextLink) next = String(p + 1);
    if (!next) {
        var pageLink = selFirst(doc, "a[href*='page=" + (p + 1) + "']");
        if (pageLink) next = String(p + 1);
    }

    return Response.success(items, next);
}
