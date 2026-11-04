load("config.js");

function execute(url, page) {
  var offset = parseInt(page) || 0;

  var response = fetchRetry(url + "&limit=32&offset=" + offset);
  if (response.ok) {
    var data;
    try { data = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    var books = parseMangaList(data);
    if (books === null) return Response.error("Không thể xác minh chương tiếng Việt, vui lòng thử lại");
    return Response.success(books, calcNextOffset(data));
  }
  return Response.error("Không thể tải dữ liệu");
}
