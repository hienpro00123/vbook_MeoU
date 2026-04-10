load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không tải được trang truyện");

    // Tên truyện
    var nameEl = selFirst(doc, "h1.text-danger");
    var name = nameEl ? nameEl.text().trim() : "";
    if (!name) {
        nameEl = selFirst(doc, "h1");
        name = nameEl ? nameEl.text().trim() : "";
    }

    // Ảnh bìa
    var coverEl = selFirst(doc, "section.infobook .book3d img, .infobook img");
    var cover = "";
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
    }
    if (!cover) {
        coverEl = selFirst(doc, "img[src*='/uploads/truyen/']");
        if (coverEl) cover = coverEl.attr("src") || "";
    }
    if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;

    // Tác giả
    var author = "";
    var infoParts = doc.select("p");
    for (var i = 0; i < infoParts.size(); i++) {
        var pText = infoParts.get(i).text();
        if (pText.indexOf("Tác Giả") !== -1 || pText.indexOf("Tác giả") !== -1) {
            var spanEl = selFirst(infoParts.get(i), "span");
            if (spanEl) {
                author = spanEl.text().trim();
            }
            if (!author) {
                author = pText.replace(/Tác [Gg]iả\s*[:\uff1a]?\s*/g, "").trim();
            }
            break;
        }
    }

    // Mô tả
    var descEl = selFirst(doc, "#infomanga");
    var description = descEl ? descEl.text().trim() : "";

    // Thể loại
    var genreEls = doc.select("a[href*='/the-loai/']");
    var genres = [];
    for (var g = 0; g < genreEls.size(); g++) {
        var gName = genreEls.get(g).text().trim();
        if (gName && genres.indexOf(gName) === -1) {
            genres.push(gName);
        }
    }

    // Trạng thái
    var status = "";
    for (var s = 0; s < infoParts.size(); s++) {
        var sText = infoParts.get(s).text();
        if (sText.indexOf("Số Chương") !== -1 || sText.indexOf("Số chương") !== -1) {
            var spanS = selFirst(infoParts.get(s), "span");
            var chText = spanS ? spanS.text().trim() : sText;
            var parts = chText.match(/(\d+)\s*\/\s*(\d+)/);
            if (parts && parts[1] === parts[2]) {
                status = "Hoàn thành";
            } else {
                status = "Đang ra";
            }
            break;
        }
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        genre: genres.join(", "),
        status: status,
        host: HOST
    });
}
