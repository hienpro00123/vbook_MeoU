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

    // Cover — ưu tiên og:image
    var coverMeta = selFirst(doc, "meta[property='og:image']");
    var cover = coverMeta ? coverMeta.attr("content") : "";
    if (!cover) {
        var coverImg = selFirst(doc, ".film-poster img, .thumb-comic img");
        cover = coverImg ? (coverImg.attr("src") || "") : "";
    }
    cover = resolveUrl(cover);

    // Genres
    var genreEls = doc.select("a[href*='/the-loai/'][rel='category tag'], .thong-tin a[href*='/the-loai/']");
    var genres = [];
    for (var i = 0; i < genreEls.size(); i++) {
        var g = genreEls.get(i).text().trim();
        if (g) genres.push(g);
    }

    // Status
    var status = "";
    var thongTin = selFirst(doc, "div.thong-tin, div.movie-detail");
    if (thongTin) {
        var allText = thongTin.text();
        var stMatch = /Trạng Thái\s*[:\uff1a]?\s*([^\n\r]+)/.exec(allText);
        if (stMatch) status = stMatch[1].trim().split("\n")[0].trim();
    }

    // Description
    var descEl = selFirst(doc, "article.item-content p, div.item-content p, .entry-content-single p");
    var description = descEl ? descEl.text().trim() : "";

    return Response.success({
        name: name,
        cover: cover,
        genres: genres,
        status: status,
        description: description
    });
}
