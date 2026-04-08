load("config.js");

function execute(url) {
    var chapId = extractChapId(url);
    if (!chapId) return Response.error("URL chương không hợp lệ");

    var data = fetchApiJson("/api/chapters/" + chapId);
    if (!data || !data.chapter) return Response.error("Không tải được nội dung chương");

    var content = data.chapter.content || "";
    if (!content) return Response.error("Chương không có nội dung");

    return Response.success(content);
}
