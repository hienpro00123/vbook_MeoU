var API_URL = "https://api.mangadex.org";
var LANGUAGE = "vi";

function getLocalized(obj) {
  if (!obj) return "";
  if (obj[LANGUAGE]) return obj[LANGUAGE];
  if (obj["en"]) return obj["en"];
  var keys = Object.keys(obj);
  return keys.length > 0 ? obj[keys[0]] : "";
}

function parseTags(tags) {
  var genres = [];
  if (!tags) return genres;
  for (var i = 0; i < tags.length; i++) {
    genres.push({ title: getLocalized(tags[i].attributes.name), input: tags[i].id, script: "genrecontent.js" });
  }
  return genres;
}

function execute() {
  var response = fetch(API_URL + "/manga/tag");
  if (response.ok) {
    var data = response.json();
    if (!data || !data.data) return Response.success([]);
    var genres = parseTags(data.data);
    genres.sort(function(a, b) { return a.title.localeCompare(b.title); });
    return Response.success(genres);
  }
  return Response.error("Không thể tải thể loại");
}
