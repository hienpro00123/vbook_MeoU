load("config.js");

function execute(url) {
  var mangaId = extractUUID(url);
  // limit=96 thay vì 500: payload nhỏ hơn, ít timeout hơn trên 5G yếu
  // toc.js sẽ tự loop thêm request cho các chương còn lại
  return Response.success([
    API_URL + "/manga/" + mangaId + "/feed?translatedLanguage[]=vi&order[volume]=asc&order[chapter]=asc&includes[]=scanlation_group&" + CONTENT_RATING + "&limit=96&offset=0"
  ]);
}
