load("config.js");

function execute(input, page) {
    // input = storyUrl, page = null on first call
    var storyUrl = input.indexOf("http") === 0 ? input : BASE_URL + input;

    var doc = fetchBrowser(storyUrl);
    if (!doc) return Response.success([], null);

    var result = [];
    var seen = {};

    // Tìm section truyện tương tự / liên quan
    var relSection = doc.selectFirst(".truyen-tuong-tu, .related-story, .story-related, .same-author");
    var container = relSection || doc;

    var links = container.select("h3 a[href], .story-name a[href], .book-title a[href]");
    if (!links || links.size() === 0) {
        links = container.select("a[href*='/'][href$='-truyen'], a[href*='/'][href$='-story']");
    }

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        if (!href || href === "/" || href.indexOf("/the-loai") >= 0 ||
            href.indexOf("/danh-sach") >= 0 || href.indexOf(storyUrl) >= 0) continue;
        if (seen[href]) continue;
        seen[href] = true;
        var name = a.text().trim();
        if (!name) continue;
        var imgEl = a.parent() ? a.parent().selectFirst("img") : null;
        var cover = imgEl ? (imgEl.attr("src") || imgEl.attr("data-src") || "") : "";
        result.push({ name: name, link: href, host: HOST, cover: cover });
    }

    return Response.success(result, null);
}
