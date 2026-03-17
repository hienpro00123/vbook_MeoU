load("config.js");

function execute(url, page) {
  if (!page) page = "1";

  var response = fetchRetry(BASE_URL + "/the-loai/" + url + "?page=" + page);
  if (response.ok) {
    var json = response.json();
    var jd = json && json.data;
    if (!jd) return Response.error("Dữ liệu không hợp lệ");
    var data = parseItems(jd.items, jd.APP_DOMAIN_CDN_IMAGE);
    var next = calcNextPage(jd.params && jd.params.pagination);
    return Response.success(data, next);
  }
  return Response.error("Không thể tải dữ liệu");
}
