load("config.js");

var SKIP_RE = /^(Đọc|Từ đầu|Mới nhất|Xem thêm|Trang trước|Trang sau|Tải thêm)$/;

function execute(url) {
    var detailUrl = resolveUrl(url);
    var doc = fetchDoc(detailUrl);
    if (!doc) return Response.error("");

    // Try reversed order first (chapters listed newest first)
    var chapLinks = doc.select("a[href*='/chuong-']");
    var chapters = [];
    var seen = {};
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href") || "";
        if (!href || href.indexOf("/chuong-") === -1) continue;
        if (seen[href]) continue;
        var cname = a.text().trim();
        if (!cname || cname.length < 2) continue;
        if (SKIP_RE.test(cname)) continue;
        seen[href] = true;
        var link = href.replace(BASE_URL, "");
        chapters.push({ name: cname, url: link, host: HOST });
    }

    // Reverse to get ascending order (chapter 1 first)
    var sorted = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        sorted.push(chapters[j]);
    }

    if (sorted.length === 0) return Response.error("");
    return Response.success(sorted);
}
