var BASE_URL = "https://truyendex.cc";
var API_URL = "https://api.mangadex.org";
var COVER_BASE = "https://uploads.mangadex.org/covers";
var PROXY_URL = "https://services.f-ck.me/v1/image/";
var LANGUAGE = "vi";
var CONTENT_RATING = "contentRating[]=safe&contentRating[]=suggestive";
var MANGA_PARAMS = "includes[]=cover_art&availableTranslatedLanguage[]=vi&" + CONTENT_RATING;

function toBase64(str) {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var result = "";
  for (var i = 0; i < str.length; i += 3) {
    var a = str.charCodeAt(i);
    var b = (i + 1 < str.length) ? str.charCodeAt(i + 1) : 0;
    var c = (i + 2 < str.length) ? str.charCodeAt(i + 2) : 0;
    result += chars.charAt((a >> 2) & 63);
    result += chars.charAt(((a & 3) << 4) | ((b >> 4) & 15));
    result += (i + 1 < str.length) ? chars.charAt(((b & 15) << 2) | ((c >> 6) & 3)) : "=";
    result += (i + 2 < str.length) ? chars.charAt(c & 63) : "=";
  }
  return result;
}

function proxyImage(url) { return PROXY_URL + toBase64(url); }

function getLocalized(obj) {
  if (!obj) return "";
  if (obj[LANGUAGE]) return obj[LANGUAGE];
  if (obj["en"]) return obj["en"];
  var keys = Object.keys(obj);
  return keys.length > 0 ? obj[keys[0]] : "";
}

function getCoverUrl(mangaId, relationships, size) {
  if (!relationships) return "";
  for (var i = 0; i < relationships.length; i++) {
    var rel = relationships[i];
    if (rel.type === "cover_art" && rel.attributes && rel.attributes.fileName) {
      return proxyImage(COVER_BASE + "/" + mangaId + "/" + rel.attributes.fileName + "." + (size || "256") + ".jpg");
    }
  }
  return "";
}

function parseMangaList(data) {
  if (!data || !data.data) return [];
  var books = [];
  for (var i = 0; i < data.data.length; i++) {
    var item = data.data[i];
    if (!item.attributes) continue;
    books.push({
      name: getLocalized(item.attributes.title),
      link: "/nettrom/truyen-tranh/" + item.id,
      host: BASE_URL,
      cover: getCoverUrl(item.id, item.relationships, "256"),
      description: getLocalized(item.attributes.description),
    });
  }
  return books;
}

function calcNextOffset(data) {
  if (!data || data.total == null) return null;
  var next = data.offset + data.limit;
  return next < data.total ? String(next) : null;
}

function execute(key, page) {
  var offset = parseInt(page) || 0;

  var response = fetch(API_URL + "/manga?" + MANGA_PARAMS + "&title=" + encodeURIComponent(key) + "&order[relevance]=desc&limit=20&offset=" + offset);
  if (response.ok) {
    var data = response.json();
    return Response.success(parseMangaList(data), calcNextOffset(data));
  }
  return Response.error("Không thể tìm kiếm");
}
