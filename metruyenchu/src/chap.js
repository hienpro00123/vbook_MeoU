load("config.js");

function execute(url) {
    var chapUrl = url.indexOf("http") === 0 ? url : BASE_URL + url;

    var doc = fetchSmart(chapUrl);
    if (!doc) return Response.error("Không tải được nội dung chương");

    // Thử nhiều selector phổ biến cho nội dung chương truyện chữ
    var contentEl = doc.selectFirst(
        "#chapter-content, .chapter-content, .content-chapter, " +
        "#truyen-content, .truyen-content, .reading-content, " +
        ".content-text, .text-content, #noi-dung, .noi-dung, " +
        "div.content"
    );

    if (!contentEl) {
        // Fallback: tìm div có text content dài nhất, dừng sớm khi đã đủ dài
        var divs = doc.select("div[class], div[id]");
        var best = null;
        var bestLen = 200;
        for (var i = 0; i < divs.size(); i++) {
            var d = divs.get(i);
            var len = d.text().length;
            if (len > bestLen) {
                bestLen = len;
                best = d;
                if (len > 5000) break; // đủ lớn → dừng ngay
            }
        }
        contentEl = best;
    }

    if (!contentEl) return Response.error("Không tìm thấy nội dung chương");

    var content = stripHtml(contentEl.html());
    if (!content) return Response.error("Nội dung chương trống");

    return Response.success(content);
}
