var BASE_URL = "https://otruyenapi.com/v1/api";
var HOST = "https://otruyen.cc";

function resolveThumb(thumb, cdnImage) {
  if (!thumb) return "";
  return thumb.indexOf("http") === 0 ? thumb : cdnImage + "/uploads/comics/" + thumb;
}

function joinArray(val) {
  if (!val || !val.length) return "";
  return Array.isArray(val) ? val.join(", ") : val;
}

function parseItems(items, cdnImage) {
  var data = [];
  if (!items) return data;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    data.push({
      name: item.name,
      link: "/truyen-tranh/" + item.slug,
      host: HOST,
      cover: resolveThumb(item.thumb_url, cdnImage),
      description: joinArray(item.origin_name),
    });
  }
  return data;
}

function calcNextPage(pagination) {
  if (!pagination) return null;
  var current = pagination.currentPage;
  var total = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);
  return current < total ? String(current + 1) : null;
}

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
