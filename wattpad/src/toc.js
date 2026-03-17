load("config.js");

function execute(url) {
  var match = url.match(/\/(\d+)-/);
  if (!match) return Response.error("URL không hợp lệ");
  var storyId = match[1];

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

  return Response.error("Không thể tải mục lục");
}
