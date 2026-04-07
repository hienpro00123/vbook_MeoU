load("config.js");

function execute(url) {
    var chapId = extractChapId(url);
    if (!chapId) return Response.error("URL chương không hợp lệ");

    var res = fetchApi("/api/chapters/" + chapId);
    if (!res) return Response.error("Không tải được nội dung chương");

    var data;
    try { data = res.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    if (!data || !data.chapter) return Response.error("Không tìm thấy chương");

    var content = data.chapter.content || "";
    if (!content) return Response.error("Chương không có nội dung");

    return Response.success(content);
}
