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

function parseStoryCards(doc) {
    var result = [];
    var seen = {};
    var coverMap = buildCoverMap(doc);

    var links = doc.select("a[href*='/truyen/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href === "/" || href.indexOf("/truyen/index.php") !== -1) continue;

        var slug = extractSlug(href);
        if (!slug || seen[slug]) continue;

        var name = a.text().trim();
        if (!name || name === "Logo" || name === "Xem thêm" || name === "Xem tất cả") continue;
        if (name.indexOf("Banner Image") !== -1) continue;
        if (name.length < 2) continue;

        seen[slug] = true;

        // Cover from inside <a> tag first, then from coverMap
        var cover = "";
        var img = selFirst(a, "img");
        if (img) {
            cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
            if (cover.indexOf("logo") !== -1 || cover.indexOf("banner") !== -1) cover = "";
        }
        if (!cover && coverMap[slug]) cover = coverMap[slug];
        if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;

        result.push({
            name: name,
            link: "/truyen/" + slug,
            host: HOST,
            cover: cover,
            description: ""
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
    var doc = null;
    if (res && res.ok) doc = res.html();
    if (!doc) {
        var browser = Engine.newBrowser();
        try { doc = browser.launch(fetchUrl, 20000); } catch (e) { doc = null; }
        try { browser.close(); } catch (e2) {}
    }
    if (!doc) return Response.error("Không tải được trang");

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
