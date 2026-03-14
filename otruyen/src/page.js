var BASE_URL = "https://otruyenapi.com/v1/api";

function execute(url) {
  var slug = url;
  var idx = url.indexOf("/truyen-tranh/");
  if (idx >= 0) {
    slug = url.substring(idx + 14);
  }
  slug = slug.replace(/\/$/, "").replace(/^\//,"");
  if (slug.indexOf("http") === 0) {
    var parts = slug.split("/");
    slug = parts[parts.length - 1];
  }
  var apiUrl = BASE_URL + "/truyen-tranh/" + slug;
  return Response.success([apiUrl]);
}
