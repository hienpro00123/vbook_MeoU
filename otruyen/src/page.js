var BASE_URL = "https://otruyenapi.com/v1/api";

function extractSlug(url) {
  var slug = url;
  var idx = url.indexOf("/truyen-tranh/");
  if (idx >= 0) slug = url.substring(idx + 14);
  slug = slug.replace(/^\/|\/$/g, "");
  if (slug.indexOf("http") === 0) {
    var parts = slug.split("/");
    slug = parts[parts.length - 1];
  }
  return slug;
}

function execute(url) {
  return Response.success([BASE_URL + "/truyen-tranh/" + extractSlug(url)]);
}
