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
            var cover = "";
            var detailRes = fetchRetry(BASE_URL + href);
            if (detailRes && detailRes.ok) {
                var detailDoc = detailRes.html();
                if (detailDoc) {
                    var imgEl = selFirst(detailDoc, ".book-info-pic img");
                    if (imgEl) {
                        cover = imgEl.attr("data-original") || imgEl.attr("data-src") || imgEl.attr("src") || "";
                        if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
                    }
                }
            }
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
