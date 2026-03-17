load("config.js");

function execute(url, page) {
  if (!page) page = "1";
  if (url.indexOf("author:") === 0) {
    var authorSlug = url.substring(7);
    var res = fetchRetry(BASE_URL + "/tac-gia/" + authorSlug + "?page=" + page);
    if (res.ok) {
      var json = res.json();
      var jd = json && json.data;
      if (!jd) return Response.success([]);
      return Response.success(
        parseItems(jd.items, jd.APP_DOMAIN_CDN_IMAGE),
        calcNextPage(jd.params && jd.params.pagination)
      );
    }
    return Response.success([]);
  }
  var response = fetchRetry(BASE_URL + "/the-loai/" + url + "?page=" + page);
  if (response.ok) {
    var json = response.json();
    var jd = json && json.data;
    if (!jd) return Response.success([]);
    return Response.success(parseItems(jd.items, jd.APP_DOMAIN_CDN_IMAGE));
  }
  return Response.success([]);
}
