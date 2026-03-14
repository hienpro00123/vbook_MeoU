var BASE_URL = "https://api.mangadex.org";

function execute(url) {
  var mangaId = url;
  if (url.indexOf("api.mangadex.org") >= 0) {
    var idx = url.indexOf("/manga/");
    if (idx >= 0) mangaId = url.substring(idx + 7);
  } else {
    var idx2 = url.indexOf("/truyen-tranh/");
    if (idx2 >= 0) mangaId = url.substring(idx2 + 14);
  }
  mangaId = mangaId.replace(/\/$/, "").replace(/^\//,"");
  if (mangaId.indexOf("/") >= 0) {
    mangaId = mangaId.split("/")[0];
  }
  if (mangaId.indexOf("?") >= 0) {
    mangaId = mangaId.split("?")[0];
  }
  return Response.success([BASE_URL + "/manga/" + mangaId]);
}
