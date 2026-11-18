load("config.js");

function execute(url) {
    var chapterUrl = absoluteUrl(url);
    if (!chapterUrl) return Response.error("Đường dẫn chương không hợp lệ");
    var res = fetch(chapterUrl);
    if (!res || !res.ok) return Response.error("Không tải được chương (HTTP " + (res ? res.status : "không kết nối") + ")");
    var doc = res.html();
    var title = cleanText(doc.select("h1.chapter-title").text());
    var content = doc.select(".reader-content");
    if (content.isEmpty() || !content.text().trim()) return Response.error("Không tìm thấy nội dung chương");
    content.select("script, style, iframe, noscript").remove();
    var html = cleanChapterHtml(content.html());
    if (!html) return Response.error("Nội dung chương trống");
    return Response.success(html, title);
}
