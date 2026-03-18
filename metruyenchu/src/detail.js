load("config.js");

function execute(url) {
    // Đảm bảo URL đầy đủ
    var storyUrl = url.indexOf("http") === 0 ? url : BASE_URL + url;
    storyUrl = storyUrl.replace(/\/$/, "");

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
        // Fallback: tìm img có alt giống tên truyện
        var imgs = doc.select("img[alt]");
        for (var i = 0; i < imgs.size(); i++) {
            var imgSrc = imgs.get(i).attr("src") || "";
            if (imgSrc && imgSrc.indexOf("logo") < 0 && imgSrc.indexOf("icon") < 0 && imgSrc.indexOf("banner") < 0) {
                cover = imgSrc;
                break;
            }
        }
    }

    // Tác giả
    var authorEl = doc.selectFirst("a[href*='/tac-gia/'], .author a, .book-author a");
    var author = authorEl ? authorEl.text().trim() : "";
    if (!author) {
        var authorText = doc.selectFirst(".author, .tac-gia");
        if (authorText) {
            author = authorText.text().replace(/Tác giả\s*[:：]?\s*/i, "").trim();
        }
    }

    // Mô tả
    var descEl = doc.selectFirst(".desc-text, .book-desc, .summary-content, .description, #story-detail-description, .truyen-tomtat");
    var description = descEl ? stripHtml(descEl.html()) : "";

    // Thể loại
    var genreAs = doc.select("a[href*='/the-loai/']");
    var genres = [];
    var genreDetail = [];
    for (var j = 0; j < genreAs.size(); j++) {
        var gTitle = genreAs.get(j).text().trim();
        var gHref = genreAs.get(j).attr("href");
        var gSlug = gHref.replace(BASE_URL, "").replace(/^\/the-loai\//, "").replace(/\/$/, "");
        if (gTitle && gSlug) {
            genres.push(gTitle);
            genreDetail.push({ title: gTitle, input: gSlug, script: "genrecontent.js" });
        }
    }

    // Trạng thái — chỉ kiểm tra phần tử trạng thái, không scan toàn trang
    var ongoing = true;
    var statusEl = doc.selectFirst(".trang-thai, .book-status, .status-label, .badge-status, [class*='trang-thai'], [class*='book-status']");
    if (statusEl) {
        var st = statusEl.text();
        if (st.indexOf("Hoàn") >= 0 || st.indexOf("Full") >= 0 || st.indexOf("FULL") >= 0 || st.indexOf("DROP") >= 0) ongoing = false;
    } else {
        var fullBadge = doc.selectFirst(".status-full, .badge-full, .label-full, .label-hoan");
        if (fullBadge) ongoing = false;
    }

    // detail info (số chương, lượt xem)
    var detailParts = [];
    if (genres.length > 0) detailParts.push("Thể loại: " + genres.join(", "));
    var chapCountEl = doc.selectFirst(".chapter-count, .so-chuong");
    if (chapCountEl) detailParts.push("Số chương: " + chapCountEl.text().trim());
    var detail = detailParts.join(" | ");

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
