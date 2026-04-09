load("config.js");
function execute(sortid, page) {
    var p = page || 1;
    var json = fetchApi("/novel/list?sortid=" + sortid + "&page=" + p + "&limit=20");
    if (!json || json.code !== 200) return Response.error("Tải danh sách thất bại");
    var data = json.data;
    var items = data.data;
    if (!items) return Response.error("Không có dữ liệu");
    var next = data.next_page ? data.next_page : null;
    var result = [];
    for (var i = 0; i < items.length; i++) {
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
    return Response.success(result, next);
}
