load("config.js");

function execute(url, page) {
  if (!page) page = "1";
  var response = fetch(BASE_URL + "/the-loai/" + url + "?page=" + page);
  if (response.ok) {
    var json = response.json();
    return Response.success(parseItems(json.data.items, json.data.APP_DOMAIN_CDN_IMAGE));
  }
  return Response.success([]);
}
