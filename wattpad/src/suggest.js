load("config.js");

function execute(input, page) {
  if (!page) page = "0";
  if (input.indexOf("author:") === 0) {
    var username = input.substring(7);
    var raw = fetchWattpad(API_V4 + "/users/" + username + "/stories", {
      fields: "stories(id,title,url,cover,user(name)),nextUrl",
      offset: page,
      limit: "30",
    });
    if (raw) { try { return parseStories(JSON.parse(raw)); } catch (e) {} }
    return Response.success([]);
  }
  var raw = fetchWattpad(API_V4 + "/search/stories", {
    query: input,
    language: LANG_VI,
    fields: "stories(id,title,url,cover,user(name)),nextUrl",
    offset: page,
    limit: "30",
  });
  if (raw) { try { return parseStories(JSON.parse(raw)); } catch (e) {} }
  return Response.success([]);
}
