var BASE_URL = "https://otruyenapi.com/v1/api";
var CDN_IMAGE = "https://img.otruyenapi.com";

function execute(key, page) {
  var response = fetch(BASE_URL + "/tim-kiem", {
    method: "GET",
    queries: { keyword: key },
  });

  if (response.ok) {
    var json = response.json();
    var items = json.data.items;
    var cdnImage = json.data.APP_DOMAIN_CDN_IMAGE;

    var data = [];
    if (items) {
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
    }
    return Response.success(data, null);
  }
  return Response.error("Không thể tìm kiếm");
}
