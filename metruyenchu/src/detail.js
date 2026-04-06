load("config.js");

var AUTHOR_SLUG_RE = /\/tac-gia\/([^\/\?]+)/;
var GENRE_SLUG_RE2 = /\/the-loai\/([^\/\?]+)/;
var CHAP_COUNT_RE = /Số chương\s*[:\uFF1A]?\s*(\d[\d.]+)/;

function execute(url) {
    var storyUrl = resolveUrl(url);

    // Detail page có đủ thông tin trong static HTML → dùng HTTP trực tiếp (nhanh hơn fetchSmart)
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không tải được trang truyện");

    // Tên truyện
    var nameEl = selFirst(doc,
        "h1.title-truyen, h1.book-title, h1.story-name, h1.truyen-title, h1.story-title, " +
        ".book-detail h1, .title h1, .info-book h1, .truyen-info h1, h1"
    );
    var name = nameEl ? nameEl.text().trim() : "";

    // Ảnh bìa
    var coverEl = selFirst(doc,
        ".book-info-pic img, .book-img img, .cover-truyen img, .book-cover img, .img-truyen img, " +
        ".thumb img, .bia-truyen img, .poster img, .info-img img, " +
        "img.img-responsive, img.lazyload[data-original], img.lazyload[data-src]"
    );
    var cover = "";
    if (coverEl) {
        cover = coverEl.attr("data-original") || coverEl.attr("data-src") || coverEl.attr("src") || "";
    }
    if (!cover) {
        var fallbackImg = selFirst(doc, "img[src]:not([src*='logo']):not([src*='icon']):not([src*='banner']):not([src*='ads'])");
        if (fallbackImg) cover = fallbackImg.attr("src") || "";
    }
    if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;

    // Tác giả
    var authorEl = selFirst(doc, "a[href*='/tac-gia/'], .author a, .book-author a, .tac-gia a, .info-author a, .writer a");
    var author = authorEl ? authorEl.text().trim() : "";
    var authorSlug = "";
    if (authorEl) {
        var authorHref = authorEl.attr("href") || "";
        var slugM = AUTHOR_SLUG_RE.exec(authorHref);
        if (slugM) authorSlug = slugM[1];
    }
    if (!author) {
        var authorText = selFirst(doc, ".author, .tac-gia, .book-author, .info-author");
        if (authorText) author = authorText.text().replace(AUTHOR_RE, "").trim();
    }

    // Mô tả
    var descEl = selFirst(doc,
        "[itemprop='description'], .desc-text, .book-desc, .summary-content, .description, " +
        "#story-detail-description, .truyen-tomtat, .tom-tat, .mo-ta, " +
        ".story-synopsis, .synopsis, .info-desc, .box-desc, .detail-desc"
    );
    var description = descEl ? stripHtml(descEl.html()) : "";

    // Thể loại — ưu tiên tìm trong info section, nếu không có thì lấy toàn trang (giới hạn 8)
    var infoSection = selFirst(doc,
        ".book-detail, .info-book, .book-info, .story-info, .truyen-info, " +
        ".detail-info, .info-story, .book-container, .truyen-detail"
    );
    var genreAs = infoSection
        ? infoSection.select("a[href*='/the-loai/']")
        : doc.select("a[href*='/the-loai/']");
    var genreDetail = [];
    var genreTitles = "";
    var seenGenre = {};
    var gMax = Math.min(genreAs.size(), infoSection ? 20 : 8); // giới hạn nếu không có container
    for (var j = 0; j < gMax; j++) {
        var gEl = genreAs.get(j);
        var gTitle = gEl.text().trim();
        var gHref = gEl.attr("href") || "";
        var gSlugM = GENRE_SLUG_RE2.exec(gHref);
        var gSlug = gSlugM ? gSlugM[1] : "";
        if (gTitle && gSlug && !seenGenre[gSlug]) {
            seenGenre[gSlug] = true;
            genreDetail.push({ title: gTitle, input: gSlug, script: "genrecontent.js" });
            genreTitles += (genreTitles ? ", " : "") + gTitle;
        }
    }

    // Trạng thái
    var ongoing = true;
    var statusEl = selFirst(doc,
        ".label-status, .trang-thai, .book-status, .status-label, .badge-status, " +
        ".status-full, .badge-full, .label-full, .label-hoan, " +
        ".complete, .finished, .truyen-full"
    );
    if (statusEl) {
        var cls = statusEl.attr("class") || "";
        if (STATUS_CLS_RE.test(cls) || STATUS_RE.test(statusEl.text())) ongoing = false;
    }
    // Kiểm tra tên truyện có "(Trọn Bộ)" / "FULL" không
    if (ongoing && STATUS_RE.test(name)) ongoing = false;

    // detail info — build string trực tiếp, không cần mảng
    var detail = genreTitles ? "Thể loại: " + genreTitles : "";
    // Trích số chương: ưu tiên class selector, fallback tìm text "Số chương" trong info section
    var chapCountEl = selFirst(doc,
        ".chapter-count, .so-chuong, .total-chapter, .num-chapter, " +
        "[class*='chapter-count'], [class*='so-chuong']"
    );
    if (chapCountEl) {
        detail += (detail ? " | " : "") + "Số chương: " + chapCountEl.text().trim();
    } else if (infoSection) {
        var infoText = infoSection.text();
        var chapMatch = CHAP_COUNT_RE.exec(infoText);
        if (chapMatch) detail += (detail ? " | " : "") + "Số chương: " + chapMatch[1];
    }

    // Suggests — luôn thêm suggest (trang truyện có truyện tương tự dưới dạng sidebar)
    var suggests = [{ title: "Truyện tương tự", input: storyUrl, script: "suggest.js" }];
    if (authorSlug) {
        suggests.push({ title: "Truyện cùng tác giả", input: "author:" + authorSlug, script: "suggest.js" });
    }

    return Response.success({
        name: name || "Đang cập nhật",
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genreDetail,
        suggests: suggests,
    });
}
