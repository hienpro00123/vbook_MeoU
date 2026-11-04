load("config.js");
load("searchtranslation.js");
function execute(key, page) {
    key = key || "";
    if (!key) return Response.error("Nhập từ khóa để tìm kiếm");

    var pageValue = String(page || "1").trim();
    if (!/^\d+$/.test(pageValue) || parseInt(pageValue, 10) < 1) {
        return Response.error("Trang không hợp lệ");
    }

    var p = parseInt(pageValue, 10);
    var resolved = novelSearchResolveQuery(key);
    if (!resolved.query) return Response.error(resolved.error || "Không dịch được từ khóa");

    var r = fetchApi("/novel/search?q=" + encodeURIComponent(resolved.query) + "&page=" + p + "&limit=20", true);
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
