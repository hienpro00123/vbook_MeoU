load("config.js");

function execute(input, page) {
    var storyUrl = resolveUrl(input);

    // Suggest lấy từ sidebar detail page — static HTML đủ dùng
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.success([], null);
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var result = [];
    var seen = {};

    // Tìm section truyện tương tự / liên quan
    var relSection = selFirst(doc,
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
        // Tìm ảnh bìa qua CSS href match
        var coverImg = selFirst(container, "a[href='" + href + "'] img");
        if (!coverImg) {
            var altHref = href.indexOf("http") === 0 ? href.replace(BASE_URL, "") : BASE_URL + href;
            coverImg = selFirst(container, "a[href='" + altHref + "'] img");
        }
        var cover = coverImg ? (coverImg.attr("data-original") || coverImg.attr("data-src") || coverImg.attr("src") || "") : "";
        if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
        result.push({ name: name, link: href, host: HOST, cover: cover });
        if (result.length >= 20) break;
    }

    return Response.success(result, null);
}
