load("config.js");

function execute() {
  var response = fetch(BASE_URL + "/the-loai");
  if (response.ok) {
    var json = response.json();
    var items = json.data.items;
    var genres = [];
    for (var i = 0; i < items.length; i++) {
      genres.push({
        title: items[i].name,
        input: items[i].slug,
        script: "genrecontent.js",
      });
    }
    return Response.success(genres);
  }
  return Response.error("Không thể tải thể loại");
}
