load("config.js");

function execute(url) {
    var storyUrl = (url.indexOf("http") === 0) ? url : BASE_URL + url;
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung trang");

    // Tiêu đề
    var titleEl = selFirst(doc, "h1.title-detail");
    var title = titleEl ? titleEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, "img.image-thumb");
    if (coverEl) {
        cover = coverEl.attr("src") || coverEl.attr("data-original") || "";
    }

    // Các thông tin từ .detail-info .row
    var author = "";
    var altName = "";
    var statusText = "";
    var rows = doc.select(".detail-info .row");
    for (var ri = 0; ri < rows.size(); ri++) {
        var row = rows.get(ri);
        var labelEl = selFirst(row, ".col-xs-4");
        var valEl = selFirst(row, ".col-xs-8");
        if (!labelEl || !valEl) continue;
        var labelText = labelEl.text().trim();
        if (labelText.indexOf("Tác giả") >= 0) {
            var authorA = selFirst(valEl, "a");
            author = authorA ? authorA.text().trim() : valEl.text().trim();
        } else if (labelText.indexOf("Tên khác") >= 0) {
            altName = valEl.text().trim();
        } else if (labelText.indexOf("Tình trạng") >= 0) {
            statusText = valEl.text().trim();
        }
    }

    // Thể loại từ .kind a
    var genres = [];
    var genreEls = doc.select(".kind a");
    for (var gi = 0; gi < genreEls.size(); gi++) {
        var ga = genreEls.get(gi);
        var gText = ga.text().trim();
        var gHref = ga.attr("href") || "";
        var gSlug = gHref.replace(BASE_URL + "/tim-truyen/", "").replace("/tim-truyen/", "").replace(/\/$/, "");
        if (gText && gSlug) {
            genres.push({ title: gText, input: gSlug, script: "genrecontent.js" });
        }
    }

    // Mô tả
    var description = "";
    var descEl = selFirst(doc, ".detail-content p");
    if (descEl) {
        description = descEl.text().trim();
    }

    var ongoing = (statusText.indexOf("Đang") >= 0 || statusText === "");

    var detail = "";
    if (altName) detail += "Tên khác: " + altName;
    if (statusText) detail += (detail ? "\n" : "") + "Tình trạng: " + statusText;

    return Response.success({
        name: title,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        suggests: [],
        comments: []
    });
}
