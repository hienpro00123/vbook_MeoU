load("config.js");
function execute(key, page) {
    key = key || "";
    if (!key) return Response.error("Nhập từ khóa để tìm kiếm");

    var p = parseInt(page, 10) || 1;
    var r = fetchApi("/novel/search?q=" + encodeURIComponent(key) + "&page=" + p + "&limit=20");
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error("Tìm kiếm thất bại");

    var d = json.data;
    if (!d) return Response.error("Không có kết quả");

    var items = d.items || d.data;
    if (!items || !items.length) return Response.error("Không có kết quả");

    var total = d.total || 0;
    var limit = d.limit || 20;
    var next = total > p * limit ? String(p + 1) : null;
    return Response.success(buildItems(items), next);
}
