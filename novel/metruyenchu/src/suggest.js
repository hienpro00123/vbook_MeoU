load("config.js");

function execute(input, page) {
    // Truyện cùng tác giả — fetch trang /tac-gia/{slug}
    if (input.indexOf("author:") === 0) {
        var slug = input.substring(7);
        var p = page ? parseInt(page) : 1;
        var authorUrl = BASE_URL + "/tac-gia/" + slug + "?page=" + p;
        var res = fetchRetry(authorUrl);
        if (!res || !res.ok) return Response.success([], null);
        var doc = res.html();
        if (!doc) return Response.success([], null);
        var items = parseList(doc);
        if (!items || items.length === 0) return Response.success([], null);
        var next = getNextPage(doc, p);
        return Response.success(items, next);
    }

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

    // Build cover map O(n) một lần — tránh O(n²) selFirst per link
    var coverMap = {};
    var aImgs = container.select("a[href]:has(img)");
    for (var ci = 0; ci < aImgs.size(); ci++) {
        var ael = aImgs.get(ci);
        var ah = ael.attr("href") || "";
        if (!ah) continue;
        var normH = ah.indexOf("http") === 0 ? ah.replace(BASE_URL, "") : ah;
        if (coverMap[normH]) continue;
        var aimg = selFirst(ael, "img");
        if (!aimg) continue;
        var asrc = aimg.attr("data-original") || aimg.attr("data-src") || aimg.attr("src") || "";
        if (asrc && asrc.charAt(0) === 47) asrc = BASE_URL + asrc;
        if (asrc) coverMap[normH] = asrc;
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
        var normHref = href.indexOf("http") === 0 ? href.replace(BASE_URL, "") : href;
        var cover = coverMap[normHref] || "";
        if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
        result.push({ name: name, link: normHref, host: HOST, cover: cover });
        if (result.length >= 20) break;
    }

    return Response.success(result, null);
}
