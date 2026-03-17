load("config.js");

function execute(url) {
  var match = url.match(/\/(\d+)-/) || url.match(/\/(\d+)(?:[?#]|$)/);
  if (!match) return Response.error("URL không hợp lệ");
  var storyId = match[1];

  var raw = fetchWattpad(API_V4 + "/stories/" + storyId, { fields: "id,parts(id,title,url)" });
  if (!raw) return Response.error("Không thể tải mục lục");

  var data;
  try { data = JSON.parse(raw); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
  if (!data.parts || !data.parts.length) return Response.error("Không có chương nào");

  var list = [];
  data.parts.forEach(function (v) {
    list.push({ name: v.title, url: v.url });
  });
  return Response.success(list);
}
