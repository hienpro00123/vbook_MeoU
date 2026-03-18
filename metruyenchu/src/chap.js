load("config.js");

function execute(url) {
    var chapUrl = url.indexOf("http") === 0 ? url : BASE_URL + url;

    var doc = fetchBrowser(chapUrl);
    if (!doc) return Response.error("Không tải được nội dung chương");

    // Thử nhiều selector phổ biến cho nội dung chương truyện chữ
    var contentEl = doc.selectFirst(
        "#chapter-content, .chapter-content, .content-chapter, " +
        "#truyen-content, .truyen-content, .reading-content, " +
        ".content-text, .text-content, #noi-dung, .noi-dung, " +
        "div.content"
    );

    if (!contentEl) {
        // Fallback: tìm div lớn nhất chứa nhiều text
        var divs = doc.select("div");
        var best = null;
        var bestLen = 0;
        for (var i = 0; i < divs.size(); i++) {
            var d = divs.get(i);
            var txt = d.ownText();
            if (txt && txt.length > bestLen) {
                bestLen = txt.length;
                best = d;
            }
        }
        contentEl = best;
    }

    if (!contentEl) return Response.error("Không tìm thấy nội dung chương");

    var content = stripHtml(contentEl.html());
    if (!content) return Response.error("Nội dung chương trống");

    return Response.success(content);
}
