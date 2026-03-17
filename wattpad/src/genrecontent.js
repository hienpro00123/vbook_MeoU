load("config.js");

function execute(input, page) {
  if (!page) page = "0";

  var data = Http.get(API_V4 + "/search/stories")
    .params({
      query: input,
      language: LANG_VI,
      fields: "stories(id,title,url,cover,user(name))",
      offset: page,
      limit: "20",
    })
    .string();
  if (!data) data = Http.get(API_V4 + "/search/stories")
    .params({
      query: input,
      language: LANG_VI,
      fields: "stories(id,title,url,cover,user(name))",
      offset: page,
      limit: "20",
    })
    .string();

  if (data) {
    try { return parseStories(JSON.parse(data)); } catch (e) {}
  }
  return Response.error("Không thể tải dữ liệu");
}
