load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);

    var doc = fetchSmart(storyUrl);
    if (!doc) return Response.error("Không tải được trang truyện");

    // Tên truyện
    var nameEl = doc.selectFirst("h1.title-truyen, h1.book-title, h1.story-name, h1, .book-detail h1, .title h1");
    var name = nameEl ? nameEl.text().trim() : "";

    // Ảnh bìa
    var coverEl = doc.selectFirst(".book-img img, .cover-truyen img, .book-cover img, .img-truyen img, img.img-responsive[src*='truyenchu'], img.lazyload");
    var cover = "";
    if (coverEl) {
        cover = coverEl.attr("src") || coverEl.attr("data-src") || coverEl.attr("data-original") || "";
    }
    if (!cover) {
        // Fallback: CSS selector 1 bước, không cần loop JS
        var fallbackImg = doc.selectFirst("img[src]:not([src*='logo']):not([src*='icon']):not([src*='banner']):not([src*='ads'])");
        if (fallbackImg) cover = fallbackImg.attr("src") || "";
    }

    // Tác giả
    var authorEl = doc.selectFirst("a[href*='/tac-gia/'], .author a, .book-author a");
    var author = authorEl ? authorEl.text().trim() : "";
    if (!author) {
        var authorText = doc.selectFirst(".author, .tac-gia");
        if (authorText) {
            author = authorText.text().replace(AUTHOR_RE, "").trim();
        }
    }

    // Mô tả
    var descEl = doc.selectFirst(".desc-text, .book-desc, .summary-content, .description, #story-detail-description, .truyen-tomtat");
    var description = descEl ? stripHtml(descEl.html()) : "";

    // Thể loại — chỉ build genreDetail, không cần mảng genres[] riêng
    var genreAs = doc.select("a[href*='/the-loai/']");
    var genreDetail = [];
    for (var j = 0; j < genreAs.size(); j++) {
        var gEl = genreAs.get(j);
        var gTitle = gEl.text().trim();
        var gSlug = gEl.attr("href").replace(/^.*\/the-loai\/|\/$|\?.*$/g, "");
        if (gTitle && gSlug) genreDetail.push({ title: gTitle, input: gSlug, script: "genrecontent.js" });
    }

    // Trạng thái — chỉ kiểm tra phần tử trạng thái, không scan toàn trang
    var ongoing = true;
    var statusEl = doc.selectFirst(".trang-thai, .book-status, .status-label, .badge-status");
    if (statusEl) {
        var st = statusEl.text();
        if (st.indexOf("Hoàn") >= 0 || st.indexOf("Full") >= 0 || st.indexOf("FULL") >= 0 || st.indexOf("DROP") >= 0) ongoing = false;
    } else {
        var fullBadge = doc.selectFirst(".status-full, .badge-full, .label-full, .label-hoan");
        if (fullBadge) ongoing = false;
    }

    // detail info — build string trực tiếp, không cần mảng
    var genreTitles = genreDetail.map(function(g) { return g.title; });
    var detail = genreTitles.length > 0 ? "Thể loại: " + genreTitles.join(", ") : "";
    var chapCountEl = doc.selectFirst(".chapter-count, .so-chuong");
    if (chapCountEl) detail += (detail ? " | " : "") + "Số chương: " + chapCountEl.text().trim();

    // Suggests
    var suggests = [];
    var suggestEl = doc.selectFirst(".truyen-tuong-tu, .related-story, .story-related");
    if (suggestEl) {
        suggests.push({ title: "Truyện tương tự", input: storyUrl, script: "suggest.js" });
    }

    return Response.success({
        name: name || "Không rõ tên",
        cover: cover || "",
        host: HOST,
        author: author || "",
        description: description || "",
        detail: detail || "",
        ongoing: ongoing,
        genres: genreDetail.length > 0 ? genreDetail : [],
        suggests: suggests,
    });
}
