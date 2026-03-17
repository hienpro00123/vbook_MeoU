load("config.js");

function execute(url, page) {
  if (!page) page = "0";

  var raw = fetchWattpad(url, {
    fields: "stories(id,title,url,cover,user(name)),nextUrl",
    offset: page,
    limit: "30",
  });

  if (raw) {
    try { return parseStories(JSON.parse(raw)); } catch (e) {}
  }
  return Response.error("Không thể tải dữ liệu");
}
