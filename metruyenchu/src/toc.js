load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);

    var doc = fetchSmart(storyUrl);
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    // Selector danh sách chương — thử nhiều pattern phổ biến
    var chapLinks = doc.select(
        ".list-chapter a[href], .muc-luc a[href], .chapter-list a[href], " +
        "ul.list-chapter li a[href], .box-list-chapter a[href], " +
        ".chapters a[href], #list-chapter a[href]"
    );

    if (chapLinks.size() === 0) {
        // Fallback: tìm tất cả link có pattern /{story}/chuong-
        var allLinks = doc.select("a[href*='chuong-'], a[href*='/chap-'], a[href*='/chapter-']");
        chapLinks = allLinks;
    }

    var seen = {};
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href");
        if (!href || HASH_RE.test(href)) continue;
        if (seen[href]) continue;
        seen[href] = true;
        // charCodeAt(0) !== 47 ('/') → URL tuyệt đối (O(1) thay indexOf)
        var fullHref = href.charCodeAt(0) !== 47 ? href : BASE_URL + href;
        var chapName = a.text().trim();
        if (!chapName) chapName = a.attr("title") || a.attr("aria-label") || "";
        if (!chapName) continue;
        chapters.push({ name: chapName, url: fullHref, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(chapters);
}
