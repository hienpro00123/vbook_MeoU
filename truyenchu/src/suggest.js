load("config.js");

var AUTHOR_SLUG_RE2 = /\/tac-gia\/([^\/]+)\/?/;

function execute(input, page) {
    var p = page ? parseInt(page) : 1;

    // Truyện cùng tác giả
    if (input.indexOf("author:") === 0) {
        var slug = input.substring(7);
        var fetchUrl = p <= 1
            ? BASE_URL + "/tac-gia/" + slug + "/"
            : BASE_URL + "/tac-gia/" + slug + "/page/" + p + "/";
        var res = fetchRetry(fetchUrl);
        if (!res || !res.ok) return Response.success([], null);
        var doc = res.html();
        if (!doc) return Response.success([], null);
        var items = parseList(doc);
        if (!items || items.length === 0) return Response.success([], null);
        var next = getNextPage(doc, p);
        return Response.success(items, next);
    }

    // Truyện liên quan từ detail page
    var storyUrl = resolveUrl(input);
    var res2 = fetchRetry(storyUrl);
    if (!res2 || !res2.ok) return Response.success([], null);
    var doc2 = res2.html();
    if (!doc2) return Response.success([], null);

    var result = [];
    var seen = {};

    // Tìm section "Truyện liên quan" / "Có thể bạn quan tâm"
    var relSection = selFirst(doc2,
        ".related-manga, .manga-related-wrapper, [class*='related'], " +
        "[class*='tuong-tu'], [class*='de-xuat']"
    );
    var container = relSection || doc2;

    var cards = container.select(".page-item-detail, .manga__item");
    if (cards.size() === 0) {
        // Fallback: lấy từ toàn trang nhưng chỉ truyện khác trang hiện tại
        var storyPath = stripHost(storyUrl);

        var links = doc2.select(".post-title a[href], h3 a[href]");
        for (var i = 0; i < links.size(); i++) {
            var a = links.get(i);
            var href = a.attr("href") || "";
            if (!href || HREF_SKIP_RE.test(href)) continue;
            if (href.indexOf("/the-loai/") !== -1 || href.indexOf("/tac-gia/") !== -1) continue;
            var link = stripHost(href);
            if (link === storyPath || seen[link]) continue;
            seen[link] = true;
            var name = a.text().trim();
            if (!name) continue;
            result.push({ name: name, link: link, host: HOST, cover: "" });
            if (result.length >= 20) break;
        }
        return Response.success(result, null);
    }

    // Parse cards từ related section
    for (var ci = 0; ci < cards.size(); ci++) {
        var card = cards.get(ci);
        var titleA = selFirst(card, ".post-title a[href], h3 a[href]");
        if (!titleA) continue;
        var href2 = titleA.attr("href") || "";
        if (!href2) continue;
        var link2 = stripHost(href2);
        if (seen[link2]) continue;
        seen[link2] = true;
        var name2 = titleA.text().trim();
        if (!name2) continue;
        var cover = extractCover(card);
        if (cover && cover.indexOf("http") !== 0) cover = BASE_URL + cover;
        result.push({ name: name2, link: link2, host: HOST, cover: cover });
        if (result.length >= 20) break;
    }

    return Response.success(result, null);
}
