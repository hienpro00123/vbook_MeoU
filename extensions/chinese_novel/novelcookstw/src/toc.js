load("config.js");
function execute(url) {
    var id = parseArticleId(url);
    if (!id) return Response.error("Không đọc được articleid từ URL");

    var r = fetchApi("/chapter/list/" + id);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error("Tải danh sách chương thất bại");

    var list = json.data;
    if (!list || !list.length) return Response.error("Không có dữ liệu chương");

    var result = [];
    for (var i = 0; i < list.length; i++) {
        var c = list[i];
        result.push({
            name: c.chaptername || ("Chương " + (i + 1)),
            url: makeChapUrl(id, c.chapterid),
            host: BASE_URL
        });
    }
    return Response.success(result);
}
