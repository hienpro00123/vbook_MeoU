load("config.js");

function execute(url) {
    var storyUrl = (url.indexOf("http") === 0) ? url : BASE_URL + url;
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung trang");

    var titleEl = selFirst(doc, "h1.tieu-de-truyen");
    var title = titleEl ? decodeEntities(titleEl.text()) : "";
    if (!title) {
        var h1 = selFirst(doc, "h1");
        title = h1 ? decodeEntities(h1.text()) : "";
    }

    var cover = cleanImgSrc(selFirst(doc, "img.wp-post-image"));
    if (!cover) cover = cleanImgSrc(selFirst(doc, ".thumb-main img"));

    var author = "";
    var statusText = "";
    var views = "";
    var updated = "";
    var infoItems = doc.select("div.info-item");
    for (var ii = 0; ii < infoItems.size(); ii++) {
        var t = decodeEntities(infoItems.get(ii).text());
        if (t.indexOf("Tác giả:") === 0) author = t.replace("Tác giả:", "").trim();
        else if (t.indexOf("Trạng thái:") === 0) statusText = t.replace("Trạng thái:", "").trim();
        else if (t.indexOf("Lượt views:") === 0) views = t.replace("Lượt views:", "").trim();
        else if (t.indexOf("Cập nhật cuối:") === 0) updated = t.replace("Cập nhật cuối:", "").trim();
    }

    var genres = [];
    var genreEls = doc.select("a.genre-link");
    for (var gi = 0; gi < genreEls.size(); gi++) {
        var gHref = genreEls.get(gi).attr("href") || "";
        var m = /\/the-loai\/([^\/?#]+)\/?/.exec(gHref);
        var gText = decodeEntities(genreEls.get(gi).text());
        if (m && gText) genres.push({ title: gText, input: m[1], script: "genrecontent.js" });
    }

    var description = "";
    var descEl = selFirst(doc, ".gioi-thieu-truyen .truyen-content");
    if (!descEl) descEl = selFirst(doc, ".truyen-content");
    if (descEl) description = decodeEntities(descEl.text());

    var ongoing = (statusText.indexOf("Đang") >= 0 || statusText === "");

    var detailParts = [];
    if (statusText) detailParts.push("Tình trạng: " + statusText);
    if (views) detailParts.push("Lượt xem: " + views);
    if (updated) detailParts.push("Cập nhật cuối: " + updated);

    return Response.success({
        name: title,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: detailParts.join("\n"),
        ongoing: ongoing,
        genres: genres,
        suggests: [],
        comments: []
    });
}
