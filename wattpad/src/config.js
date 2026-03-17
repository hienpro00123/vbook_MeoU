var BASE_URL = "https://www.wattpad.com";
var API_V3 = BASE_URL + "/api/v3";
var API_V4 = BASE_URL + "/v4";
var APIV2 = BASE_URL + "/apiv2";
var LANG_VI = "19"; // Tiếng Việt (xác nhận từ Wattpad language select)

// Gọi HTTP với retry 1 lần nếu thất bại
function fetchWattpad(url, params) {
  var req = Http.get(url);
  if (params) req = req.params(params);
  var res = req.string();
  if (!res) {
    req = Http.get(url);
    if (params) req = req.params(params);
    res = req.string();
  }
  return res;
}

function parseStories(data) {
  if (!data || !data.stories || !data.stories.length) return Response.success([], null);
  var next = data.nextUrl ? data.nextUrl.match(/offset=(\d+)/) : null;
  next = next ? next[1] : null;
  var list = [];
  data.stories.forEach(function (v) {
    if (!v.url) return; // bỏ qua truyện không có link
    list.push({
      name: v.title || "(Không có tên)",
      link: v.url,
      cover: v.cover || "",
      description: v.user ? v.user.name : "",
    });
  });
  return Response.success(list, next);
}
