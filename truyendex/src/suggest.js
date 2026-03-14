load("config.js");
load("utils.js");

function execute(key) {
  if (!key || key.length < 2) return Response.success([]);

  var url = BASE_URL + "/manga?limit=10&title=" + encodeURIComponent(key)
    + "&availableTranslatedLanguage[]=" + VI_LANG
    + "&" + INCLUDES_COVER
    + "&" + CONTENT_RATINGS
    + "&order[relevance]=desc";

  var response = fetch(url);
  if (response.ok) {
    var json = JSON.parse(response.text());
    var items = json.data;
    var data = [];
    for (var i = 0; i < items.length; i++) {
      var manga = items[i];
      var title = getMangaTitle(manga.attributes);
      var viTitle = getAltTitle(manga.attributes, "vi");
      var cover = getCoverUrl(manga.id, manga.relationships);

      data.push({
        name: viTitle || title,
        link: "/nettrom/truyen-tranh/" + manga.id,
        host: SITE_URL,
        cover: cover,
      });
    }
    return Response.success(data);
  }
  return Response.success([]);
}
