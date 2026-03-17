load("config.js");

function execute(key, page) {
  if (!page) page = "1";

  var response = fetchRetry(BASE_URL + "/tim-kiem", {
    method: "GET",
    queries: { keyword: key, page: page },
  });

  if (response.ok) {
    var json;
    try { json = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    var jd = json && json.data;
    if (!jd) return Response.error("Dữ liệu không hợp lệ");
    var data = parseItems(jd.items, jd.APP_DOMAIN_CDN_IMAGE);
    var next = calcNextPage(jd.params && jd.params.pagination);
    return Response.success(data, next);
  }
  return Response.error("Không thể tìm kiếm");
}
