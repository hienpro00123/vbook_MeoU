load("config.js");

var GENRE_SLUG_RE = /\/the-loai\/([^\/]+)\/?/;

function execute(url) {
    var fullUrl = resolveUrl(url);

    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Fetch error: " + fullUrl);

    var doc = res.html();

    // Title
    var title = "";
    var h1 = selFirst(doc, ".info_kuro h1, h1");
    if (h1) title = h1.text().trim();

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".cover_kuro img[data-src], .cover_kuro img[src]");
    if (!coverEl) coverEl = selFirst(doc, ".novel_kuro img[data-src], .novel_kuro img[src]");
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
        if (cover.indexOf("data:") === 0) cover = "";
    }

    // Author
    var author = "";
    var infoPs = doc.select(".info_kuro p, .container_kuro p");
    for (var i = 0; i < infoPs.size(); i++) {
        var pText = infoPs.get(i).text();
        if (pText.indexOf("Tác giả") !== -1) {
            author = pText.replace("Tác giả:", "").replace("Tác giả", "").trim();
            break;
        }
    }
    if (!author || author === "Chưa có thông tin") author = "Kuro Trans";

    // Status
    var status = "";
    var statusEl = selFirst(doc, ".status-inline, .badge_kuro");
    if (statusEl) {
        var stxt = statusEl.text().trim();
        if (stxt.indexOf("Completed") !== -1 || stxt.indexOf("completed") !== -1 || stxt.indexOf("Hoàn") !== -1) status = "Completed";
        else if (stxt.indexOf("Ongoing") !== -1 || stxt.indexOf("ongoing") !== -1 || stxt.indexOf("Đang ra") !== -1) status = "Ongoing";
    }

    // Genres
    var genres = [];
    var genresList = [];
    var genreLinks = doc.select(".genres_kuro a[href*='/the-loai/']");
    var seenGenre = {};
    for (var k = 0; k < genreLinks.size(); k++) {
        var gEl = genreLinks.get(k);
        var g = gEl.text().trim();
        if (g && !seenGenre[g]) {
            seenGenre[g] = true;
            genres.push(g);
            var gHref = gEl.attr("href") || "";
            var gm = GENRE_SLUG_RE.exec(gHref);
            if (gm) genresList.push({ title: g, input: gm[1], script: "genrecontent.js" });
        }
    }

    // Description
    var desc = "";
    var summaries = doc.select(".summary_kuro");
    for (var s = 0; s < summaries.size(); s++) {
        var sumText = summaries.get(s).text().trim();
        if (sumText.indexOf("Tóm tắt") !== -1) {
            desc = sumText.replace("Tóm tắt:", "").replace("Tóm tắt", "").trim();
            break;
        }
    }

    var detail = "";
    if (status) detail += "Tình trạng: " + status;
    if (genres.length > 0) detail += (detail ? "\n" : "") + "Thể loại: " + genres.join(", ");

    var ongoing = (status.indexOf("Completed") === -1 && status.indexOf("Hoàn") === -1);

    var result = {
        name: title,
        cover: cover,
        host: HOST,
        author: author,
        description: desc,
        detail: detail,
        ongoing: ongoing,
        genres: genresList,
        comments: []
    };

    return Response.success(result);
}
