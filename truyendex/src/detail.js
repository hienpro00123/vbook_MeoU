var BASE_URL = "https://api.mangadex.org";
var COVER_URL = "https://mangadex.org/covers";
var SITE_URL = "https://truyendex.cc/nettrom";

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

function execute(url) {
  var mangaId = url;
  var idx = url.indexOf("/truyen-tranh/");
  if (idx >= 0) {
    mangaId = url.substring(idx + 14);
  }
  mangaId = mangaId.replace(/\/$/, "").replace(/^\//,"");
  if (mangaId.indexOf("/") >= 0) {
    var parts = mangaId.split("/");
    mangaId = parts[0];
  }

  var apiUrl = BASE_URL + "/manga/" + mangaId + "?includes[]=cover_art&includes[]=author&includes[]=artist";
  var response = fetch(apiUrl);
  if (response.ok) {
    var json = JSON.parse(response.text());
    var manga = json.data;
    var attr = manga.attributes;

    var title = getMangaTitle(attr);
    var viTitle = getAltTitle(attr, "vi");
    var displayName = viTitle || title;
    var cover = getCoverUrl(manga.id, manga.relationships);

    var authorName = "";
    var rels = manga.relationships;
    for (var i = 0; i < rels.length; i++) {
      if (rels[i].type === "author" && rels[i].attributes) {
        if (authorName) authorName += ", ";
        authorName += rels[i].attributes.name;
      }
    }

    var description = "";
    if (attr.description) {
      description = attr.description.vi || attr.description.en || "";
    }

    var genres = [];
    if (attr.tags) {
      for (var j = 0; j < attr.tags.length; j++) {
        var tag = attr.tags[j];
        if (tag.attributes.group === "genre") {
          genres.push({
            title: tag.attributes.name.vi || tag.attributes.name.en,
            input: tag.id,
            script: "genrecontent.js",
          });
        }
      }
    }

    var isOngoing = attr.status === "ongoing";

    var detail = "";
    if (viTitle && title !== viTitle) {
      detail = "Tên gốc: " + title;
    }

    return Response.success({
      name: displayName,
      cover: cover,
      host: SITE_URL,
      author: authorName,
      description: description,
      genre: genres,
      ongoing: isOngoing,
      detail: detail,
    });
  }
  return Response.error("Không thể tải thông tin truyện");
}
