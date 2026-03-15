load("config.js");

function execute() {
  var response = fetch(BASE_URL + "/the-loai");
  if (response.ok) {
    return Response.success(parseGenres(response.json().data.items));
  }
  return Response.error("Không thể tải thể loại");
}
