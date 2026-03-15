load("config.js");

function execute(key, page) {
  var offset = parseInt(page) || 0;

  var response = fetch(API_URL + "/manga?" + MANGA_PARAMS + "&title=" + encodeURIComponent(key) + "&order[relevance]=desc&limit=20&offset=" + offset);
  if (response.ok) {
    var data = response.json();
    return Response.success(parseMangaList(data), calcNextOffset(data));
  }
  return Response.error("Không thể tìm kiếm");
}
