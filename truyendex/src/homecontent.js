load("config.js");

function execute(url, page) {
  var offset = parseInt(page) || 0;

  var response = fetch(url + "&limit=20&offset=" + offset);
  if (response.ok) {
    var data = response.json();
    return Response.success(parseMangaList(data), calcNextOffset(data));
  }
  return Response.error("Không thể tải dữ liệu");
}
