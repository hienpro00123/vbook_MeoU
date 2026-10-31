load("config.js");
function execute(sortid, page) {
    var p = parseInt(page, 10) || 1;
    var r = fetchApi("/novel/list?sortid=" + sortid + "&page=" + p + "&limit=20");
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error("Tải danh sách thất bại");

    var d = json.data;
    if (!d) return Response.error("Không có dữ liệu");

    var items = d.data || d.items;
    if (!items || !items.length) return Response.error("Không có dữ liệu thể loại");

    var next = d.next_page ? String(p + 1) : null;
    return Response.success(buildItems(items), next);
}
