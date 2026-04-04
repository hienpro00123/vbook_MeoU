load("config.js");

var TOC_FIELDS = { fields: "id,parts(id,title,url)" }; // cache — không tạo mới mỗi call

function execute(url) {
  var match = extractStoryId(url);
  if (!match) return Response.error("URL không hợp lệ");
  var storyId = match;

  var data = fetchWattpadJson(API_V4 + "/stories/" + storyId, TOC_FIELDS);
  // Fallback sang v3 nếu v4 thất bại hoặc không trả về parts
  if (!data || !data.parts) {
    data = fetchWattpadJson(API_V3 + "/stories/" + storyId, TOC_FIELDS);
  }
  if (!data || !data.parts || !data.parts.length) return Response.success([]); // truyện chưa có chương

  var list = [];
  data.parts.forEach(function (v) {
    if (!v.url) return; // bỏ qua part thiếu URL
    list.push({ name: v.title || "Chương", url: v.url });
  });
  return Response.success(list);
}
