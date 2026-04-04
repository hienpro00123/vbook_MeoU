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
        var maxItems = Math.min(cards.size(), 10); // giới hạn 10 — tránh 25 request tuần tự
        for (var i = 0; i < maxItems; i++) {
            var card = cards.get(i);
            var titleA = selFirst(card, ".iname h3 a[href]");
            if (!titleA) continue;
            var href = titleA.attr("href");
            if (!href) continue;
            if (href.charAt(0) !== "/") href = "/" + href;
            var name = titleA.text().trim();
            if (!name) continue;
            var cover = "";
            // Phase 1: Tìm cover trong card — tránh HTTP thêm (background-image / data-*)
            var bgEl = selFirst(card, "[style*='background-image'], [data-thumb], [data-cover], [data-img], .book-thumb, .img-truyen");
            if (bgEl) {
                var bg = bgEl.attr("data-thumb") || bgEl.attr("data-cover") || bgEl.attr("data-img") || bgEl.attr("data-src") || "";
                if (!bg) {
                    var bgM = BG_IMAGE_RE.exec(bgEl.attr("style") || "");
                    if (bgM) bg = bgM[1];
                }
                if (bg) cover = bg.charAt(0) === 47 ? BASE_URL + bg : bg;
            }
            // Phase 2: Fetch trang detail chỉ khi card không có cover
            if (!cover) {
                var detailRes = fetchRetry(BASE_URL + href);
                if (detailRes && detailRes.ok) {
                    var detailDoc = detailRes.html();
                    if (detailDoc) {
                        // og:image ở <head> thường có URL đầy đủ — fallback .book-info-pic img
                        var metaOg = selFirst(detailDoc, "meta[property='og:image']");
                        cover = metaOg ? (metaOg.attr("content") || "") : "";
                        if (!cover) {
                            var imgEl = selFirst(detailDoc, ".book-info-pic img");
                            if (imgEl) cover = imgEl.attr("data-original") || imgEl.attr("data-src") || imgEl.attr("src") || "";
                        }
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
