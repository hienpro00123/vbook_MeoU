load("config.js");

function execute(url) {
  var match = extractStoryId(url);
  if (!match) return Response.error("URL không hợp lệ");
  var storyId = match;

  var FIELDS = { fields: "id,parts(id,title,url)" };
  var raw = fetchWattpad(API_V4 + "/stories/" + storyId, FIELDS);
  var data;
  if (raw) { try { data = JSON.parse(raw); } catch (e) {} }
  // Fallback sang v3 nếu v4 thất bại hoặc không trả về parts
  if (!data || !data.parts) {
    var raw3 = fetchWattpad(API_V3 + "/stories/" + storyId, FIELDS);
    if (raw3) { try { data = JSON.parse(raw3); } catch (e) {} }
  }
  if (!data || !data.parts || !data.parts.length) return Response.success([]); // truyện chưa có chương

  var list = [];
  data.parts.forEach(function (v) {
    if (!v.url) return; // bỏ qua part thiếu URL
    list.push({ name: v.title || "Chương", url: v.url });
  });
  return Response.success(list);
}
