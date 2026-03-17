load("config.js");

function execute(key, page) {
  if (!page) page = "0";

  var data = Http.get(API_V4 + "/search/stories")
    .params({
      query: key,
      language: LANG_VI,
      fields: "stories(id,title,url,cover,user(name))",
      offset: page,
      limit: "10",
    })
    .string();

  if (data) return parseStories(JSON.parse(data));
  return Response.error("Không thể tìm kiếm");
}
