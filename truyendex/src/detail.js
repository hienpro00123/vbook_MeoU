load("config.js");
load("utils.js");

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
