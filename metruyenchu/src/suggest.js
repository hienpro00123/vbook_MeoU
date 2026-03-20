load("config.js");

function execute(input, page) {
    var storyUrl = resolveUrl(input);

    var doc = fetchSmart(storyUrl);
    if (!doc) return Response.success([], null);

    var result = [];
    var seen = {};

    // Tìm section truyện tương tự / liên quan
    var relSection = doc.selectFirst(
        ".truyen-tuong-tu, .related-story, .story-related, .same-author, " +
        ".truyen-lien-quan, .truyen-de-xuat, .box-truyen-hot, " +
        "#truyen-hot-moi, .truyen-hot-moi"
    );
    var container = relSection || doc;

    // Path của trang hiện tại — lọc chính trang này khỏi suggest
    var storyPath = storyUrl.replace(BASE_URL, "");

    var links = container.select("h3 a[href], .story-name a[href], .book-title a[href]");
    if (links.size() === 0) {
        // Fallback: lấy tất cả a[href], dùng loop filter loại non-story links
        links = container.select("a[href]");
    }

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        if (!href || href === "/" || HREF_SKIP_RE.test(href)) continue;
        // Chỉ nhận link của host này (loại external + /contact /tos ...)
        if (href.indexOf("http") === 0 && href.indexOf(BASE_URL) !== 0) continue;
        // Loại chính trang hiện tại (xử lý cả relative và absolute href)
        if (href.replace(BASE_URL, "") === storyPath) continue;
        if (seen[href]) continue;
        seen[href] = true;
        var name = a.text().trim();
        if (!name || name.length < 3) continue;
        // Tìm ảnh bìa: lên 2 cấp (a→h3→container div) như parseList
        var parent = a.parent();
        var gp = parent ? parent.parent() : null;
        var imgEl = gp ? gp.selectFirst("img[data-original], img[data-src], img[src]") : null;
        if (!imgEl && parent) imgEl = parent.selectFirst("img");
        var cover = imgEl ? (imgEl.attr("data-original") || imgEl.attr("data-src") || imgEl.attr("src") || "") : "";
        result.push({ name: name, link: href, host: HOST, cover: cover });
        if (result.length >= 20) break;
    }

    return Response.success(result, null);
}
