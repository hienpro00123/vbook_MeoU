load("config.js");

function execute(url) {
    var bookUrl = absoluteUrl(url);
    if (!bookUrl) return Response.error("Đường dẫn truyện không hợp lệ");
    bookUrl = bookUrl.replace(/[?#].*$/, "").replace(/\/+$/, "");
    if (!/\/truyen\/[^\/]+$/.test(bookUrl)) return Response.error("Không nhận diện được truyện");
    var chapterPrefix = bookUrl + "/";
    var chapters = [];
    var seen = {};
    var expectedTotal = 0;
    var currentPage = 1;

    while (currentPage <= 100) {
        var pageUrl = setQuery(setQuery(bookUrl, "page", currentPage), "pageSize", 100);
        var res = fetch(pageUrl);
        if (!res || !res.ok) return Response.error("Không tải đủ mục lục (HTTP " + (res ? res.status : "không kết nối") + ")");
        var doc = res.html();
        var links = doc.select(".chapter-items a[href]");
        if (links.size() === 0 && !doc.select(".reader-content").isEmpty()) {
            var finalUrl = absoluteUrl(res.url || bookUrl);
            var chapterName = cleanText(doc.select("h1.chapter-title").text());
            if (!finalUrl || !chapterName) return Response.error("Không nhận diện được chương duy nhất");
            return Response.success([{ name: chapterName, url: finalUrl.replace(/[?#].*$/, ""), host: BASE_URL }]);
        }
        var added = 0;
        for (var i = 0; i < links.size(); i++) {
            var link = links.get(i);
            var chapterUrl = absoluteUrl(link.attr("href"));
            chapterUrl = String(chapterUrl || "").replace(/[?#].*$/, "");
            var name = cleanText(link.text());
            if (!chapterUrl || chapterUrl.indexOf(chapterPrefix) !== 0 || !name || seen[chapterUrl]) continue;
            seen[chapterUrl] = true;
            chapters.push({ name: name, url: chapterUrl, host: BASE_URL });
            added++;
        }
        if (!added) return Response.error("Mục lục trang " + currentPage + " không có chương mới");
        var summary = cleanText(doc.select(".pagination-summary").text());
        var match = /Hiển thị\s+(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)/.exec(summary);
        if (!match) {
            if (currentPage === 1) break;
            return Response.error("Không xác định được số trang mục lục");
        }
        var pageEnd = parseInt(match[2], 10);
        var total = parseInt(match[3], 10);
        if (total > expectedTotal) expectedTotal = total;
        if (pageEnd >= total) break;
        currentPage++;
    }
    if (currentPage > 100) return Response.error("Mục lục có quá nhiều trang");
    if (!chapters.length) return Response.error("Không tìm thấy mục lục chương");
    if (expectedTotal && chapters.length !== expectedTotal) {
        return Response.error("Mục lục bị thiếu chương (" + chapters.length + "/" + expectedTotal + ")");
    }
    return Response.success(chapters);
}
