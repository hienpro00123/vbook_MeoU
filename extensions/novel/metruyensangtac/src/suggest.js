load("config.js");

function execute(input, page) {
    var storyUrl = resolveUrl(input);
    var currentSlug = extractSlug(storyUrl);

    var doc = null;
    var res = fetchRetry(storyUrl);
    if (res && res.ok) doc = res.html();

    if (!doc) {
        var browser = Engine.newBrowser();
        try {
            doc = browser.launch(storyUrl, 15000);
        } catch (e) {
            doc = null;
        }
        try { browser.close(); } catch (e2) {}
    }

    if (!doc) return Response.success([], null);

    var result = [];
    var seen = {};
    if (currentSlug) seen[currentSlug] = true;

    // Build cover map — img is sibling of <a>, not child
    var coverMap = {};
    var allEls = doc.select("a[href*='/truyen/'], img[src*='/uploads/']");
    var lastSlug = "";
    for (var m = 0; m < allEls.size(); m++) {
        var el = allEls.get(m);
        var elHref = el.attr("href") || "";
        var elSrc = el.attr("src") || "";
        if (elHref && elHref.indexOf("/truyen/") !== -1 && !elSrc) {
            lastSlug = extractSlug(elHref) || "";
        } else if (elSrc && elSrc.indexOf("/uploads/") !== -1) {
            if (lastSlug && !coverMap[lastSlug]) {
                var imgUrl = elSrc;
                if (imgUrl.charAt(0) === "/") imgUrl = BASE_URL + imgUrl;
                coverMap[lastSlug] = imgUrl;
            }
        }
    }

    // Collect story links from "Truyện cùng thể loại" and same author sections
    var links = doc.select("a[href*='/truyen/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (href.indexOf("index.php") !== -1) continue;

        var slug = extractSlug(href);
        if (!slug || seen[slug]) continue;

        var name = a.text().trim();
        if (!name || name === "Logo" || name.length < 2) continue;
        if (name.indexOf("Banner") !== -1) continue;

        seen[slug] = true;

        var cover = coverMap[slug] || "";

        result.push({
            name: name,
            link: "/truyen/" + slug,
            host: HOST,
            cover: cover
        });
        if (result.length >= 12) break;
    }

    return Response.success(result, null);
}
