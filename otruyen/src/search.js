load("config.js");

function execute(key, page) {
  if (!page) page = "1";

  var response = fetch(BASE_URL + "/tim-kiem", {
    method: "GET",
    queries: { keyword: key, page: page },
  });

  if (response.ok) {
    var json = response.json();
    var data = parseItems(json.data.items, json.data.APP_DOMAIN_CDN_IMAGE);
    var next = calcNextPage(json.data.params && json.data.params.pagination);
    return Response.success(data, next);
  }
  return Response.error("Không thể tìm kiếm");
}
