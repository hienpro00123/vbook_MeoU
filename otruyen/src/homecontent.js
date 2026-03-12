load("config.js");

function execute(url, page) {
  if (!page) page = "1";

  var response = fetch(BASE_URL + "/danh-sach/" + url + "?page=" + page);
  if (response.ok) {
    var json = response.json();
    var items = json.data.items;
    var cdnImage = json.data.APP_DOMAIN_CDN_IMAGE;
    var pagination = json.data.params.pagination;
    var currentPage = pagination.currentPage;
    var totalPages = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);
    var next = currentPage < totalPages ? String(currentPage + 1) : null;

    var data = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var thumb = item.thumb_url;
      if (thumb && thumb.indexOf("http") !== 0) {
        thumb = cdnImage + "/uploads/comics/" + thumb;
      }
      data.push({
        name: item.name,
        link: "/truyen-tranh/" + item.slug,
        host: "https://otruyen.cc",
        cover: thumb,
        description: item.origin_name ? (Array.isArray(item.origin_name) ? item.origin_name.join(", ") : item.origin_name) : "",
      });
    }
    return Response.success(data, next);
  }
  return Response.error("Không thể tải dữ liệu");
}
