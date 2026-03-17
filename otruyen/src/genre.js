load("config.js");

function execute() {
  var response = fetchRetry(BASE_URL + "/the-loai");
  if (response.ok) {
    var json;
    try { json = response.json(); } catch (e) { return Response.error("Không thể tải thể loại"); }
    var items = json && json.data && json.data.items;
    if (!items) return Response.error("Không thể tải thể loại");
    return Response.success(parseGenres(items));
  }
  return Response.error("Không thể tải thể loại");
}
