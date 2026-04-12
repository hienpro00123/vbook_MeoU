load("config.js");

function execute(input, page) {
    var storyUrl = resolveUrl(input);
    var currentSlug = extractSlug(storyUrl);

    // Load detail page to get related stories
    var browser = Engine.newBrowser();
    var doc = null;
    try {
        doc = browser.launch(storyUrl, 15000);
    } catch (e) {
        doc = null;
    }
    try { browser.close(); } catch (e2) {}

    if (!doc) return Response.success([], null);

    var result = [];
    var seen = {};
    if (currentSlug) seen[currentSlug] = true;

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

        var cover = "";
        var img = selFirst(a, "img");
        if (img) {
            cover = img.attr("src") || "";
            if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;
        }

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
