load("config.js");

function buildCoverMap(doc) {
    var map = {};
    var all = doc.select("a[href*='/truyen/'], img[src*='/uploads/']");
    var lastSlug = "";
    var lastImg = "";
    for (var i = 0; i < all.size(); i++) {
        var el = all.get(i);
        var href = el.attr("href") || "";
        var src = el.attr("src") || "";
        if (href.indexOf("/truyen/") !== -1 && href.indexOf("/truyen/index.php") === -1) {
            var s = extractSlug(href);
            if (s) {
                lastSlug = s;
                if (lastImg && !map[s]) map[s] = lastImg;
                lastImg = "";
            }
        } else if (src.indexOf("/uploads/") !== -1) {
            var imgUrl = el.attr("data-src") || el.attr("data-original") || src;
            if (imgUrl.indexOf("logo") === -1 && imgUrl.indexOf("banner") === -1) {
                if (imgUrl.charAt(0) === "/") imgUrl = BASE_URL + imgUrl;
                if (lastSlug && !map[lastSlug]) map[lastSlug] = imgUrl;
                lastImg = imgUrl;
            }
        }
    }
    return map;
}

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/index.php?quanly=truyen&theloai=" + url;
    if (p > 1) fetchUrl += "&page=" + p;

    var res = fetchRetry(fetchUrl);
    var doc = null;
    if (res && res.ok) doc = res.html();
    if (!doc) {
        var browser = Engine.newBrowser();
        try { doc = browser.launch(fetchUrl, 20000); } catch (e) { doc = null; }
        try { browser.close(); } catch (e2) {}
    }
    if (!doc) return Response.success([], null);

    var items = [];
    var seen = {};
    var coverMap = buildCoverMap(doc);

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
        if (!cover && coverMap[slug]) cover = coverMap[slug];
        if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;

        items.push({
            name: name,
            link: "/truyen/" + slug,
            host: HOST,
            cover: cover,
            description: ""
        });
        if (items.length >= 30) break;
    }

    if (!items || items.length === 0) return Response.success([], null);

    var next = null;
    var nextLink = selFirst(doc, "a:matchesOwn(Next), a:matchesOwn(next), a:matchesOwn(»)");
    if (nextLink) next = String(p + 1);
    if (!next) {
        var pageLink = selFirst(doc, "a[href*='page=" + (p + 1) + "']");
        if (pageLink) next = String(p + 1);
    }

    return Response.success(items, next);
}
