load("config.js");

function execute(url) {
    var detailUrl = resolveUrl(url);
    var res = fetchRetry(detailUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc trang truyen");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    // Title
    var titleEl = selFirst(doc, "h1.entry-title");
    var name = titleEl ? titleEl.text().trim() : "";

    // Cover
    var coverMeta = selFirst(doc, "meta[property='og:image']");
    var cover = coverMeta ? coverMeta.attr("content") : "";
    if (!cover) {
        var coverImg = selFirst(doc, "img.lazyload[data-src], img[data-src]");
        cover = coverImg ? (coverImg.attr("data-src") || "") : "";
    }
    if (cover) cover = resolveUrl(cover);

    // Genres - a[rel='category tag'] trong div.thong-tin
    var genreEls = doc.select("div.thong-tin a[rel='category tag']");
    var genres = [];
    var seenG = {};
    for (var i = 0; i < genreEls.size(); i++) {
        var g = genreEls.get(i).text().trim();
        if (g && !seenG[g]) { genres.push(g); seenG[g] = true; }
    }

    // Status - span sau span có text 'Tr'
    var status = "";
    var thongTin = selFirst(doc, "div.thong-tin");
    if (thongTin) {
        var spans = thongTin.select("span");
        for (var j = 0; j < spans.size(); j++) {
            var spanText = spans.get(j).text();
            if (spanText.indexOf("Tr\u1ea1ng Th\u00e1i") >= 0) {
                // span tiếp theo chứa giá trị
                if (j + 1 < spans.size()) {
                    status = spans.get(j + 1).text().trim();
                }
                break;
            }
        }
    }

    // Description - p trong article.item-content
    var descEl = selFirst(doc, "article.item-content p, div.item-content p");
    var description = descEl ? descEl.text().trim() : "";

    return Response.success({
        name: name,
        cover: cover,
        genres: genres,
        status: status,
        description: description
    });
}
