var BASE_URL = "https://www.wattpad.com";
var API_V3 = BASE_URL + "/api/v3";
var API_V4 = BASE_URL + "/v4";
var APIV2 = BASE_URL + "/apiv2";
var LANG_VI = "19"; // Tiếng Việt (xác nhận từ Wattpad language select)

function parseStories(data) {
  var next = data.nextUrl ? data.nextUrl.match(/offset=(\d+)/) : null;
  next = next ? next[1] : "";
  var list = [];
  data.stories.forEach(function (v) {
    list.push({
      name: v.title,
      link: v.url,
      cover: v.cover,
      description: v.user.name,
    });
  });
  return Response.success(list, next);
}
