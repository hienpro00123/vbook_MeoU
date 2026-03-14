load("config.js");

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
