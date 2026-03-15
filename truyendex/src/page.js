load("config.js");

function execute(url) {
  var mangaId = extractUUID(url);
  return Response.success([
    API_URL + "/manga/" + mangaId + "/feed?translatedLanguage[]=vi&order[volume]=asc&order[chapter]=asc&includes[]=scanlation_group&" + CONTENT_RATING + "&limit=500&offset=0"
  ]);
}
