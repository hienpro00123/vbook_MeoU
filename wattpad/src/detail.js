load("config.js");

function execute(url) {
  var match = url.match(/\/(\d+)-/) || url.match(/\/(\d+)(?:[?#]|$)/);
  if (!match) return Response.error("URL không hợp lệ");
  var storyId = match[1];

  var FIELDS = { fields: "id,title,cover,url,description,user(name),completed,categories,tags" };
  var raw = fetchWattpad(API_V4 + "/stories/" + storyId, FIELDS);
  var data;
  if (raw) { try { data = JSON.parse(raw); } catch (e) {} }
  // Fallback sang v3 nếu v4 thất bại hoặc không trả về title
  if (!data || !data.title) {
    var raw3 = fetchWattpad(API_V3 + "/stories/" + storyId, FIELDS);
    if (raw3) { try { data = JSON.parse(raw3); } catch (e) {} }
  }
  if (!data || !data.title) return Response.error("Không thể tải thông tin truyện");

  var genres = [];
  var tags = [];
  if (data.categories) {
    data.categories.forEach(function (c) {
      var name = c.viName || c.name || c.enName;
      if (name) genres.push(name);
    });
  }
  if (data.tags) {
    data.tags.forEach(function (t) { tags.push(t); });
  }

  var suggests = [];
  if (tags.length > 0) {
    suggests.push({ title: "Truyện cùng thể loại", input: tags[0], script: "suggest.js" });
  } else if (genres.length > 0) {
    suggests.push({ title: "Truyện cùng thể loại", input: genres[0], script: "suggest.js" });
  }
  if (data.user && data.user.name) {
    suggests.push({ title: "Truyện cùng tác giả", input: "author:" + data.user.name, script: "suggest.js" });
  }

  return Response.success({
    name: data.title,
    cover: data.cover,
    host: BASE_URL,
    author: data.user ? data.user.name : "",
    description: data.description || "",
    detail: genres.concat(tags).join(", "),
    ongoing: !data.completed,
    suggests: suggests,
  });
}
