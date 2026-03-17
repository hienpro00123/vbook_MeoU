load("config.js");

function execute(url, page) {
  var offset = parseInt(page) || 0;
  if (url.indexOf("author:") === 0) {
    var authorId = url.substring(7);
    var res = fetchRetry(API_URL + "/manga?authors[]=" + authorId + "&" + MANGA_LIST_PARAMS + "&order[followedCount]=desc&limit=20&offset=" + offset);
    if (res.ok) {
      var data;
      try { data = res.json(); } catch (e) { return Response.success([]); }
      return Response.success(parseMangaList(data), calcNextOffset(data));
    }
    return Response.success([]);
  }
  var response = fetchRetry(API_URL + "/manga?" + MANGA_LIST_PARAMS + "&includedTags[]=" + url + "&order[followedCount]=desc&limit=20&offset=" + offset);
  if (response.ok) {
    var data;
    try { data = response.json(); } catch (e) { return Response.success([]); }
    return Response.success(parseMangaList(data), calcNextOffset(data));
  }
  return Response.success([]);
}
