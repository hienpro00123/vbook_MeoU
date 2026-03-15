load("config.js");

function execute(url, page) {
  if (!page) page = "1";
  if (url.indexOf("author:") === 0) {
    var authorSlug = url.substring(7);
    var res = fetch(BASE_URL + "/tac-gia/" + authorSlug + "?page=" + page);
    if (res.ok) {
      var json = res.json();
      var data = json.data;
      return Response.success(
        parseItems(data.items, data.APP_DOMAIN_CDN_IMAGE),
        calcNextPage(data.params && data.params.pagination)
      );
    }
    return Response.success([]);
  }
  var response = fetch(BASE_URL + "/the-loai/" + url + "?page=" + page);
  if (response.ok) {
    var json = response.json();
    return Response.success(parseItems(json.data.items, json.data.APP_DOMAIN_CDN_IMAGE));
  }
  return Response.success([]);
}
