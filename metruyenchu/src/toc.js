load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);

    // Trang detail truyện render bằng JS — dùng fetchSmart (HTTP → browser fallback)
    var doc = fetchSmart(storyUrl);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    // Selector danh sách chương — thử nhiều pattern phổ biến
    var chapLinks = doc.select(
        ".list-chapter a[href], .muc-luc a[href], .chapter-list a[href], " +
        "ul.list-chapter li a[href], .box-list-chapter a[href], " +
        ".chapters a[href], #list-chapter a[href], " +
        ".danh-sach-chuong a[href], .ds-chuong a[href], " +
        ".list-chap a[href], .chap-list a[href], " +
        ".box-tab-content a[href], .tab-content a[href*='chuong-']"
    );

    if (chapLinks.size() === 0) {
        // Fallback: tìm tất cả link có pattern /chuong- (mã định danh chương metruyenchu)
        chapLinks = doc.select("a[href*='/chuong-']");
    }

    // Lọc chỉ lấy link chương của truyện này
    var slug = storyUrl.replace(BASE_URL, "").replace(/^\//, "").replace(/\/$/, "");
    var seen = {};
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href");
        if (!href || HASH_RE.test(href)) continue;
        // Chỉ lấy link chứa slug của truyện (match chính xác path segment)
        if (slug && href.indexOf("/" + slug + "/") === -1) continue;
        if (seen[href]) continue;
        seen[href] = true;
        var fullHref = href.charCodeAt(0) !== 47 ? href : BASE_URL + href;
        var chapName = a.text().trim();
        if (!chapName) chapName = a.attr("title") || a.attr("aria-label") || "";
        if (!chapName) continue;
        chapters.push({ name: chapName, url: fullHref, host: HOST });
    }

    // Nếu vẫn không có — fallback không lọc slug
    if (chapters.length === 0) {
        for (var i2 = 0; i2 < chapLinks.size(); i2++) {
            var a2 = chapLinks.get(i2);
            var href2 = a2.attr("href");
            if (!href2 || HASH_RE.test(href2)) continue;
            if (seen[href2]) continue;
            seen[href2] = true;
            var fullHref2 = href2.charCodeAt(0) !== 47 ? href2 : BASE_URL + href2;
            var chapName2 = a2.text().trim();
            if (!chapName2) chapName2 = a2.attr("title") || a2.attr("aria-label") || "";
            if (!chapName2) continue;
            chapters.push({ name: chapName2, url: fullHref2, host: HOST });
        }
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(chapters);
}

