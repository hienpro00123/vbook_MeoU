load("config.js");
function execute(url) {
    var articleId = parseArticleId(url);
    var chapterId = parseChapterId(url);
    if (!articleId || !chapterId) return Response.error("Không đọc được ID từ URL");

    var r = fetchApi("/chapter/content/" + articleId + "/" + chapterId);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error(json.msg || "Tải nội dung chương thất bại");

    var data = json.data;
    if (!data || !data.content) return Response.error("Nội dung chương trống");

    return Response.success(textToHtml(data.content), data.chaptername || "");
}
