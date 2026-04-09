load("config.js");
function execute() {
    var json = fetchApi("/novel/hot");
    if (!json || json.code !== 200) return Response.error("Tải gợi ý thất bại");
    var items = json.data;
    if (!items) return Response.error("Không có dữ liệu");
    var result = [];
    var limit = items.length < 10 ? items.length : 10;
    for (var i = 0; i < limit; i++) {
        var n = items[i];
        var id = n.articleid;
        result.push({
            name: n.articlename || "",
            link: BASE_URL + "/novel.html?articleid=" + id,
            host: BASE_URL,
            cover: coverUrl(id),
            description: n.intro || ""
        });
    }
    return Response.success(result);
}
