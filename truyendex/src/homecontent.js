var BASE_URL = "https://api.mangadex.org";
var COVER_URL = "https://uploads.mangadex.org/covers";
var SITE_URL = "https://truyendex.cc/nettrom";
var VI_LANG = "vi";
var CONTENT_RATINGS = "contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica";
var INCLUDES_COVER = "includes[]=cover_art";

function getCoverUrl(mangaId, relationships) {
  if (!relationships) return "";
  for (var i = 0; i < relationships.length; i++) {
    var rel = relationships[i];
    if (rel.type === "cover_art" && rel.attributes && rel.attributes.fileName) {
      return COVER_URL + "/" + mangaId + "/" + rel.attributes.fileName + ".256.jpg";
    }
  }
  return "";
}

function getMangaTitle(attributes) {
  if (attributes.title) {
    if (attributes.title.vi) return attributes.title.vi;
    if (attributes.title.en) return attributes.title.en;
    if (attributes.title["ja-ro"]) return attributes.title["ja-ro"];
    if (attributes.title.ja) return attributes.title.ja;
    var keys = Object.keys(attributes.title);
    if (keys.length > 0) return attributes.title[keys[0]];
  }
  return "Unknown";
}

function getAltTitle(attributes, lang) {
  if (attributes.altTitles) {
    for (var i = 0; i < attributes.altTitles.length; i++) {
      var alt = attributes.altTitles[i];
      if (alt[lang]) return alt[lang];
    }
  }
  return "";
}

function execute(input, page) {
  if (!page) page = "0";
  var offset = parseInt(page) * 20;

  var url = BASE_URL + "/manga?limit=20&offset=" + offset
    + "&availableTranslatedLanguage[]=" + VI_LANG
    + "&" + INCLUDES_COVER
    + "&" + CONTENT_RATINGS
    + "&order[" + input + "]=desc";

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
