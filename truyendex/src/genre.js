load("config.js");

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
