var BASE_URL = "https://otruyenapi.com/v1/api";

function parseGenres(items) {
  var genres = [];
  if (!items) return genres;
  for (var i = 0; i < items.length; i++) {
    genres.push({ title: items[i].name, input: items[i].slug, script: "genrecontent.js" });
  }
  return genres;
}

function execute() {
  var response = fetch(BASE_URL + "/the-loai");
  if (response.ok) {
    return Response.success(parseGenres(response.json().data.items));
  }
  return Response.error("Không thể tải thể loại");
}
