load("config.js");

function execute(url, page) {
  if (!page) page = "0";

  var data = Http.get(url)
    .params({
      fields: "stories(id,title,url,cover,user(name))",
      offset: page,
      limit: "10",
    })
    .string();
  if (!data) data = Http.get(url)
    .params({
      fields: "stories(id,title,url,cover,user(name))",
      offset: page,
      limit: "10",
    })
    .string();

  if (data) return parseStories(JSON.parse(data));
  return Response.error("Không thể tải dữ liệu");
}
