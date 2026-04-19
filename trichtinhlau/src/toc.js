load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var baseUrl = storyUrl.replace(/\?.*$/, "");

    var chapters = [];
    var seen = {};
    var page = 1;

    while (true) {
        var fetchUrl = page === 1 ? baseUrl : (baseUrl + "?page=" + page);
        var res = fetchRetry(fetchUrl);
        if (!res || !res.ok) break;
        var doc = res.html();
        if (!doc) break;

        var chapLinks = doc.select("a[href*='/doc-truyen/']");
        var added = 0;
        for (var i = 0; i < chapLinks.size(); i++) {
            var a = chapLinks.get(i);
            var href = a.attr("href");
            if (!href || seen[href]) continue;
            seen[href] = true;
            var name = a.text().trim();
            if (!name) continue;
            var fullUrl = href.indexOf("http") === 0 ? href : BASE_URL + href;
            chapters.push({ name: name, url: fullUrl, host: HOST });
            added++;
        }

        // Kiểm tra có trang tiếp theo không
        var nextLink = selFirst(doc, "a[href*='?page=" + (page + 1) + "']");
        if (!nextLink || added === 0) break;
        page++;
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(chapters);
}
