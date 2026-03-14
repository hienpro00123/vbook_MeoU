load("config.js");
load("utils.js");

function execute(tagId, page) {
  if (!page) page = "0";
  var offset = parseInt(page) * 20;

  var url = BASE_URL + "/manga?limit=20&offset=" + offset
    + "&includedTags[]=" + tagId
    + "&availableTranslatedLanguage[]=" + VI_LANG
    + "&" + INCLUDES_COVER
    + "&" + CONTENT_RATINGS
    + "&order[latestUploadedChapter]=desc";

  var response = fetch(url);
  if (response.ok) {
    var json = JSON.parse(response.text());
    var items = json.data;
    var total = json.total;
    var nextPage = (offset + 20 < total) ? String(parseInt(page) + 1) : null;

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
        description: title,
      });
    }
    return Response.success(data, nextPage);
  }
  return Response.error("Không thể tải dữ liệu");
}
