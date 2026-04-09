load("config.js");
function execute(key, page) {
    var p = page || 1;
    var q = encodeURIComponent(key);
    var json = fetchApi("/novel/search?q=" + q + "&page=" + p + "&limit=20");
    if (!json || json.code !== 200) return Response.error("Tìm kiếm thất bại");
    var data = json.data;
    var items = data.items;
    if (!items) return Response.error("Không có kết quả");
    var totalPages = Math.ceil(data.total / 20);
    var next = p < totalPages ? p + 1 : null;
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
