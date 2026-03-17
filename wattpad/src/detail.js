load("config.js");

function execute(url) {
  var match = url.match(/\/(\d+)-/);
  if (!match) return Response.error("URL không hợp lệ");
  var storyId = match[1];

  var data = Http.get(API_V3 + "/stories/" + storyId)
    .params({
      fields: "id,title,cover,url,description,user(name),completed,categories,tags",
    })
    .string();

  if (data) {
    data = JSON.parse(data);

    var genres = [];
    var tags = [];
    if (data.categories) {
      data.categories.forEach(function (c) {
        if (c.enName) genres.push(c.enName);
      });
    }
    if (data.tags) {
      data.tags.forEach(function (t) {
        tags.push(t);
      });
    }

    // Dùng tag đầu tiên để gợi ý truyện cùng thể loại
    var suggests = [];
    if (tags.length > 0) {
      suggests.push({
        title: "Truyện cùng thể loại",
        input: tags[0],
        script: "suggest.js",
      });
    } else if (genres.length > 0) {
      suggests.push({
        title: "Truyện cùng thể loại",
        input: genres[0],
        script: "suggest.js",
      });
    }
    // Gợi ý truyện cùng tác giả
    if (data.user && data.user.name) {
      suggests.push({
        title: "Truyện cùng tác giả",
        input: "author:" + data.user.name,
        script: "suggest.js",
      });
    }

    return Response.success({
      name: data.title,
      cover: data.cover,
      host: BASE_URL,
      author: data.user.name,
      description: data.description,
      detail: genres.concat(tags).join(", "),
      ongoing: !data.completed,
      suggests: suggests,
    });
  }

  return Response.error("Không thể tải thông tin truyện");
}
