load("config.js");

var CHAP_RE = /\/(?:vi\/)?stories\/([^\/]+)\/([^\/\?]+)/;

function execute(url) {
    if (!CHAP_RE.test(url)) return Response.error("URL chương không hợp lệ");
    var doc = fetchPage(url);
    if (!doc) return Response.error("Không tải được trang chương Storya");
    var content = doc.select(".reader-content");
    if (content.isEmpty()) return Response.error("Không tìm thấy nội dung chương");
    return Response.success(content.get(0).html());
}
