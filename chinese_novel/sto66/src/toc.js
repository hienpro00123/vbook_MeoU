load("config.js");

function execute(url) {
    var match = String(url || "").match(/(?:^|\/)book\/([A-Za-z0-9]+)\.html(?:[?#].*)?$/);
    if (!match) return Response.error("Không nhận diện được truyện");
    var prefix = "/chapter/" + match[1];
    var next = BASE_URL + prefix + ".html";
    var pages = {};
    var seen = {};
    var chapters = [];
    var expectedPages = 0;
    var pagesRead = 0;
    var rateLimitRetried = false;

    while (next) {
        if (pages[next]) return Response.error("Danh sách chương có trang lặp");
        pages[next] = true;
        var res = fetch(next);
        if (res && !res.ok && res.status === 400 && !rateLimitRetried && res.text().indexOf('"swq-003"') >= 0) {
            rateLimitRetried = true;
            sleep(61000);
            res = fetch(next);
        }
        if (!res || !res.ok) return Response.error("Không tải đủ danh sách chương (HTTP " + (res ? res.status : "không kết nối") + ")");
        var doc = res.html();
        pagesRead++;
        if (pagesRead === 1) expectedPages = doc.select("#linkIndex option").size();
        var links = doc.select(".chapterlist dd a[href]");
        if (links.size() === 0) return Response.error("Không tìm thấy chương trong danh sách");
        var previousCount = chapters.length;
        for (var i = 0; i < links.size(); i++) {
            var link = links.get(i);
            var href = link.attr("href") || "";
            var name = link.text().trim();
            if (href.indexOf(prefix + "/") !== 0 || !name) continue;
            var chapterUrl = absoluteUrl(href);
            if (!chapterUrl || seen[chapterUrl]) continue;
            seen[chapterUrl] = true;
            chapters.push({ name: name, url: chapterUrl, host: BASE_URL });
        }
        if (chapters.length === previousCount) return Response.error("Trang chương không có chương mới");
        var nextHref = doc.select("#linkNext").attr("href") || "";
        if (nextHref && nextHref.indexOf(prefix + "/") !== 0) return Response.error("Đường dẫn trang chương không hợp lệ");
        if (!nextHref && expectedPages > pagesRead) return Response.error("Danh sách chương bị thiếu trang");
        next = nextHref ? absoluteUrl(nextHref) : "";
    }
    if (!chapters.length) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(chapters);
}
