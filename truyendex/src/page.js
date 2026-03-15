var API_URL = "https://api.mangadex.org";
var CONTENT_RATING = "contentRating[]=safe&contentRating[]=suggestive";

function extractUUID(url) {
  var match = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i.exec(url);
  return match ? match[1] : url;
}

function execute(url) {
  var mangaId = extractUUID(url);
  return Response.success([
    API_URL + "/manga/" + mangaId + "/feed?translatedLanguage[]=vi&order[volume]=asc&order[chapter]=asc&includes[]=scanlation_group&" + CONTENT_RATING + "&limit=500&offset=0"
  ]);
}
