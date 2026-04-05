load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var isHome = (url === "/");
    var fetchUrl = isHome
        ? BASE_URL + "/"
        : BASE_URL + "/danh-sach/" + url + "?page=" + p;
    var res = fetchRetry(fetchUrl);
    if (!res.ok) return Response.error("Không tải được trang " + fetchUrl);
    var doc = res.html();

    if (isHome) {
        // Homepage dùng div.itemupdate (khác cấu trúc div.item ở genre/danh-sach)
        var cards = doc.select("div.itemupdate");
        var result = [];
        for (var i = 0; i < cards.size(); i++) {
            var card = cards.get(i);
            var titleA = selFirst(card, ".iname h3 a[href]");
            if (!titleA) continue;
            var href = titleA.attr("href");
            if (!href) continue;
            if (href.charAt(0) !== "/") href = "/" + href;
            var name = titleA.text().trim();
            if (!name) continue;

            // Tìm cover trực tiếp trong card — không fetch thêm request
            var cover = "";
            // Thử img tag với data-* attributes
            var imgEl = selFirst(card, "img[data-original], img[data-src], img[data-lazy], img[src]");
            if (imgEl) {
                cover = imgEl.attr("data-original") || imgEl.attr("data-src") ||
                        imgEl.attr("data-lazy") || imgEl.attr("src") || "";
            }
            // Thử background-image / data-thumb / data-cover trên element bất kỳ
            if (!cover) {
                var bgEl = selFirst(card, "[data-thumb], [data-cover], [data-img], [style*='background-image']");
                if (bgEl) {
                    cover = bgEl.attr("data-thumb") || bgEl.attr("data-cover") || bgEl.attr("data-img") || "";
                    if (!cover) {
                        var bgM = BG_IMAGE_RE.exec(bgEl.attr("style") || "");
                        if (bgM) cover = bgM[1];
                    }
                }
            }
            if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
            result.push({ name: name, link: href, host: HOST, cover: cover, description: "" });
        }
        if (!result || result.length === 0) return Response.success([], null);
        return Response.success(result, null);
    }

    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
