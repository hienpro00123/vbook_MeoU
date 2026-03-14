var BASE_URL = "https://api.mangadex.org";

function execute() {
  var response = fetch(BASE_URL + "/manga/tag");
  if (response.ok) {
    var json = JSON.parse(response.text());
    var tags = json.data;
    var genres = [];
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      if (tag.attributes.group === "genre") {
        var name = tag.attributes.name.vi || tag.attributes.name.en || "Unknown";
        genres.push({
          title: name,
          input: tag.id,
          script: "genrecontent.js",
        });
      }
    }
    genres.sort(function(a, b) {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    });
    return Response.success(genres);
  }
  return Response.error("Không thể tải thể loại");
}
