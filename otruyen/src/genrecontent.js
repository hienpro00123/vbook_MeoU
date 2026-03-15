load("config.js");

function execute(url, page) {
  if (!page) page = "1";

  var response = fetch(BASE_URL + "/the-loai/" + url + "?page=" + page);
  if (response.ok) {
    var json = response.json();
    var data = parseItems(json.data.items, json.data.APP_DOMAIN_CDN_IMAGE);
    var next = calcNextPage(json.data.params.pagination);
    return Response.success(data, next);
  }
  return Response.error("Không thể tải dữ liệu");
}
