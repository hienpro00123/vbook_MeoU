load("config.js");

function parseStoryCards(doc) {
    var result = [];
    var seen = {};

    // Story cards with image and title link
    var links = doc.select("a[href*='/truyen/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href === "/" || href.indexOf("/truyen/index.php") !== -1) continue;

        var slug = extractSlug(href);
        if (!slug || seen[slug]) continue;

        var name = a.text().trim();
        // Skip non-story links
        if (!name || name === "Logo" || name === "Xem thêm" || name === "Xem tất cả") continue;
        if (name.indexOf("Banner Image") !== -1) continue;
        if (name.length < 2) continue;

        seen[slug] = true;

        var cover = "";
        var img = selFirst(a, "img");
        if (img) {
            cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
            if (cover.indexOf("logo") !== -1 || cover.indexOf("banner") !== -1) cover = "";
        }
        if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;

        var desc = ""

        result.push({
            name: name,
            link: "/truyen/" + slug,
            host: HOST,
            cover: cover,
            description: desc
        });
        if (result.length >= 30) break;
    }
    return result;
}

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/";

    if (url === "new") {
        fetchUrl = BASE_URL + "/index.php?quanly=truyen&tinhtrang=0";
        if (p > 1) fetchUrl += "&page=" + p;
    } else if (url === "full") {
        fetchUrl = BASE_URL + "/index.php?quanly=truyen&tinhtrang=1";
        if (p > 1) fetchUrl += "&page=" + p;
    } else if (url === "updated") {
        fetchUrl = BASE_URL + "/";
    }

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang");
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseStoryCards(doc);
    if (!items || items.length === 0) return Response.success([], null);

    // Check pagination for new/full pages
    var next = null;
    if (url === "new" || url === "full") {
        var nextLink = selFirst(doc, "a:matchesOwn(Next), a:matchesOwn(next), a:matchesOwn(»)");
        if (nextLink) next = String(p + 1);
        if (!next) {
            var pageLink = selFirst(doc, "a[href*='page=" + (p + 1) + "']");
            if (pageLink) next = String(p + 1);
        }
    }

    return Response.success(items, next);
}
