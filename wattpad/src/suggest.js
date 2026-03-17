load("config.js");

function execute(input, page) {
  if (!page) page = "0";
  if (input.indexOf("author:") === 0) {
    var username = input.substring(7);
    var data = Http.get(API_V3 + "/users/" + username + "/stories")
      .params({
        fields: "stories(id,title,url,cover,user(name)),nextUrl",
        offset: page,
        limit: "10",
      })
      .string();
    if (!data) data = Http.get(API_V3 + "/users/" + username + "/stories")
      .params({
        fields: "stories(id,title,url,cover,user(name)),nextUrl",
        offset: page,
        limit: "10",
      })
      .string();
    if (data) {
      try { return parseStories(JSON.parse(data)); } catch (e) {}
    }
    return Response.success([]);
  }
  var data = Http.get(API_V4 + "/search/stories")
    .params({
      query: input,
      language: LANG_VI,
      fields: "stories(id,title,url,cover,user(name)),nextUrl",
      offset: page,
      limit: "10",
    })
    .string();
  if (!data) data = Http.get(API_V4 + "/search/stories")
    .params({
      query: input,
      language: LANG_VI,
      fields: "stories(id,title,url,cover,user(name)),nextUrl",
      offset: page,
      limit: "10",
    })
    .string();
  if (data) {
    try { return parseStories(JSON.parse(data)); } catch (e) {}
  }
  return Response.success([]);
}
