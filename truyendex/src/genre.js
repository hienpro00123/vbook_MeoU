load("config.js");

function execute() {
  var response = fetchRetry(API_URL + "/manga/tag");
  if (response.ok) {
    var data;
    try { data = response.json(); } catch (e) { return Response.error("Không thể tải thể loại"); }
    if (!data || !data.data) return Response.success([]);
    var genres = parseTags(data.data);
    genres.sort(function(a, b) { return a.title.localeCompare(b.title); });
    return Response.success(genres);
  }
  return Response.error("Không thể tải thể loại");
}
