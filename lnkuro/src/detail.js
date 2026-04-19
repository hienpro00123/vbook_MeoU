load("config.js");

var GENRE_SLUG_RE = /\/the-loai\/([^\/]+)\/?/;

function execute(url) {
    var fullUrl = resolveUrl(url);

    var doc = loadDoc(fullUrl);
    if (!doc) return Response.error("Fetch error: " + fullUrl);

    // Title
    var title = "";
    var h1 = selFirst(doc, ".info_kuro h1, h1");
    if (h1) title = h1.text().trim();

    // Cover - novel_kuro has real cover, cover_kuro has placeholder
    var cover = "";
    var coverEl = selFirst(doc, ".novel_kuro img[data-src]");
    if (!coverEl) coverEl = selFirst(doc, ".cover_kuro img[data-src]");
    if (!coverEl) coverEl = selFirst(doc, ".cover_kuro img[src]");
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
        if (cover.indexOf("data:") === 0 || cover.indexOf("dummy") !== -1) cover = "";
        if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
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

    // Status - .status-inline has actual status text
    var status = "";
    var statusEls = doc.select(".status-inline");
    for (var si = 0; si < statusEls.size(); si++) {
        var stxt = statusEls.get(si).text().trim();
        if (stxt.indexOf("Completed") !== -1 || stxt.indexOf("completed") !== -1 || stxt.indexOf("Hoàn") !== -1) { status = "Completed"; break; }
        if (stxt.indexOf("Ongoing") !== -1 || stxt.indexOf("ongoing") !== -1 || stxt.indexOf("Đang ra") !== -1) { status = "Ongoing"; break; }
    }

    // Genres
    var genresList = [];
    var genreNames = [];
    var genreLinks = doc.select(".genres_kuro a[href*='/the-loai/']");
    var seenGenre = {};
    for (var k = 0; k < genreLinks.size(); k++) {
        var gEl = genreLinks.get(k);
        var g = gEl.text().trim();
        if (g && !seenGenre[g]) {
            seenGenre[g] = true;
            genreNames.push(g);
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
    if (genreNames.length > 0) detail += (detail ? "\n" : "") + "Thể loại: " + genreNames.join(", ");

    var ongoing = (status !== "Completed");

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
