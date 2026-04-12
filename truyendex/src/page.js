load("config.js");

function execute(url) {
  var mangaId = extractUUID(url);
  // limit=500: giảm số request tuần tự cho manga nhiều chương (toc.js làm pagination)
  // MangaDex API hỗ trợ tối đa 500 mục/request cho /manga/{id}/feed
  return Response.success([
    API_URL + "/manga/" + mangaId + "/feed?translatedLanguage[]=vi&order[volume]=asc&order[chapter]=asc&includes[]=scanlation_group&" + FEED_CONTENT_RATING + "&limit=500&offset=0"
  ]);
}
