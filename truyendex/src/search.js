load("config.js");

function execute(key, page) {
  var offset = parseInt(page) || 0;

  var response = fetchRetry(API_URL + "/manga?" + MANGA_LIST_PARAMS + "&title=" + encodeURIComponent(key) + "&order[relevance]=desc&limit=20&offset=" + offset);
  if (response.ok) {
    var data;
    try { data = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    return Response.success(parseMangaList(data), calcNextOffset(data));
  }
  return Response.error("Không thể tìm kiếm");
}
