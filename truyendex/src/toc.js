load("config.js");

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

  var allChapters = [];
  var offset = 0;
  var limit = 500;
  var hasMore = true;

  while (hasMore) {
    var feedUrl = BASE_URL + "/manga/" + mangaId + "/feed"
      + "?translatedLanguage[]=" + VI_LANG
      + "&order[chapter]=asc"
      + "&limit=" + limit
      + "&offset=" + offset
      + "&includes[]=scanlation_group";

    var response = fetch(feedUrl);
    if (!response.ok) break;

    var json = JSON.parse(response.text());
    var chapters = json.data;
    var total = json.total;

    for (var i = 0; i < chapters.length; i++) {
      var chap = chapters[i];
      var chapNum = chap.attributes.chapter || "0";
      var chapTitle = chap.attributes.title || "";
      var chapName = "Chương " + chapNum;
      if (chapTitle) {
        chapName += ": " + chapTitle;
      }

      var group = "";
      for (var j = 0; j < chap.relationships.length; j++) {
        if (chap.relationships[j].type === "scanlation_group" && chap.relationships[j].attributes) {
          group = chap.relationships[j].attributes.name;
          break;
        }
      }
      if (group) {
        chapName += " [" + group + "]";
      }

      allChapters.push({
        name: chapName,
        url: chap.id,
      });
    }

    offset += chapters.length;
    hasMore = offset < total;
  }

  return Response.success(allChapters);
}
