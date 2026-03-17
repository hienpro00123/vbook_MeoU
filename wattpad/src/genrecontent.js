load("config.js");

function execute(input, page) {
  if (!page) page = "0";

  var raw = fetchWattpad(API_V4 + "/search/stories", {
    query: input,
    language: LANG_VI,
    fields: "stories(id,title,url,cover,user(name)),nextUrl",
    offset: page,
    limit: "30",
  });

  if (raw) {
    try { return parseStories(JSON.parse(raw)); } catch (e) {}
  }
  return Response.error("Không thể tải dữ liệu");
}
