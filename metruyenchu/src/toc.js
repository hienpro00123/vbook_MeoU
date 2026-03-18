load("config.js");

function execute(url) {
    var storyUrl = url.indexOf("http") === 0 ? url : BASE_URL + url;
    storyUrl = storyUrl.replace(/\/$/, "");

    var doc = fetchSmart(storyUrl);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    // Selector danh sách chương — thử nhiều pattern phổ biến
    var chapLinks = doc.select(
        ".list-chapter a[href], .muc-luc a[href], .chapter-list a[href], " +
        "ul.list-chapter li a[href], .box-list-chapter a[href], " +
        ".chapters a[href], #list-chapter a[href]"
    );

    if (!chapLinks || chapLinks.size() === 0) {
        // Fallback: tìm tất cả link có pattern /{story}/chuong-
        var allLinks = doc.select("a[href*='chuong-'], a[href*='/chap-'], a[href*='/chapter-']");
        chapLinks = allLinks;
    }

    var seen = {};
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href");
        if (!href || href === "#" || href.indexOf("javascript") >= 0) continue;
        // Chuẩn hóa URL
        var fullHref = href.indexOf("http") === 0 ? href : BASE_URL + href;
        if (seen[fullHref]) continue;
        seen[fullHref] = true;
        var chapName = a.text().trim();
        if (!chapName) {
            // Lấy tên từ title attribute hoặc aria-label
            chapName = a.attr("title") || a.attr("aria-label") || "";
        }
        if (!chapName) continue;
        chapters.push({ name: chapName, url: fullHref, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(chapters);
}
