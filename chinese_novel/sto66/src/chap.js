load("config.js");

function execute(url) {
    var chapterUrl = absoluteUrl(url);
    if (!chapterUrl) return Response.error("Đường dẫn chương không hợp lệ");
    var res = fetch(chapterUrl);
    if (!res || !res.ok) return Response.error("Không tải được chương (HTTP " + (res ? res.status : "không kết nối") + ")");
    var doc = res.html();
    var content = doc.select("#content.readcontent");
    if (content.isEmpty() || !content.text().trim()) return Response.error("Không tìm thấy nội dung chương");
    content.select("script, style, iframe").remove();
    return Response.success(content.html(), doc.select("h1").text().trim());
}
