load("config.js");

function execute(url) {
  var storyId = url.match(/\/(\d+)-/)[1];

  var data = Http.get(API_V3 + "/stories/" + storyId)
    .params({
      fields: "id,parts(id,title,url)",
    })
    .string();

  if (data) {
    data = JSON.parse(data);
    var list = [];
    data.parts.forEach(function (v) {
      list.push({
        name: v.title,
        url: v.url,
      });
    });
    return Response.success(list);
  }

  return null;
}
