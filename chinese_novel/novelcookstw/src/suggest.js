load("config.js");
function execute() {
    var r = fetchApi("/novel/hot", true);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200 || !json.data) return Response.error("Không có dữ liệu");

    var items = buildItems(json.data, 10);
    return items.length ? Response.success(items) : Response.error("Không có dữ liệu");
}
