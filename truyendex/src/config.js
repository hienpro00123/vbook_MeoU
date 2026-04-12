var BASE_URL = "https://truyendex.cc";
var API_URL = "https://api-proxy.truyendex.cc/mangadex";
var API_FALLBACK = "https://api.mangadex.org";
var COVER_BASE = "https://uploads.mangadex.org/covers";
var IMAGE_CDN = "https://uploads.mangadex.org";
var PROXY_URL = "https://services.f-ck.me/v1/image/";
var LANGUAGE = "vi";
var CONTENT_RATING = "contentRating[]=safe&contentRating[]=suggestive";
var FEED_CONTENT_RATING = "contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic";
var MANGA_PARAMS = "includes[]=cover_art&availableTranslatedLanguage[]=vi&hasAvailableChapters=true&" + CONTENT_RATING;
var MANGA_LIST_PARAMS = MANGA_PARAMS;

// BASE64_CHARS cache — không tạo lại mỗi lần toÀn Base64 được gọi (32+/lần trang)
var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function toBase64(str) {
  var result = "";
  for (var i = 0; i < str.length; i += 3) {
    var a = str.charCodeAt(i);
    var b = (i + 1 < str.length) ? str.charCodeAt(i + 1) : 0;
    var c = (i + 2 < str.length) ? str.charCodeAt(i + 2) : 0;
    result += BASE64_CHARS.charAt((a >> 2) & 63);
    result += BASE64_CHARS.charAt(((a & 3) << 4) | ((b >> 4) & 15));
    result += (i + 1 < str.length) ? BASE64_CHARS.charAt(((b & 15) << 2) | ((c >> 6) & 3)) : "=";
    result += (i + 2 < str.length) ? BASE64_CHARS.charAt(c & 63) : "=";
  }
  return result;
}

// Pre-detect btoa — tránh try/catch overhead mỗi lần gọi proxyImage (32+ lần/trang)
var HAS_BTOA = false;
try { HAS_BTOA = typeof btoa === "function"; } catch(e) {}

function proxyImage(url) {
  return PROXY_URL + (HAS_BTOA ? btoa(url) : toBase64(url));
}

function getLocalized(obj) {
  if (!obj) return "";
  if (obj[LANGUAGE]) return obj[LANGUAGE];
  if (obj["en"]) return obj["en"];
  var keys = Object.keys(obj);
  return keys.length > 0 ? obj[keys[0]] : "";
}

function getTitle(titleObj) { return getLocalized(titleObj); }
function getDescription(descObj) { return getLocalized(descObj); }

function getCoverUrl(mangaId, relationships, size) {
  if (!relationships) return "";
  for (var i = 0; i < relationships.length; i++) {
    var rel = relationships[i];
    if (rel.type === "cover_art" && rel.attributes && rel.attributes.fileName) {
      var url = COVER_BASE + "/" + mangaId + "/" + rel.attributes.fileName + "." + (size || "256") + ".jpg";
      return proxyImage(url);
    }
  }
  return "";
}

function getRelName(relationships, type) {
  if (!relationships) return "";
  for (var i = 0; i < relationships.length; i++) {
    if (relationships[i].type === type && relationships[i].attributes) {
      return relationships[i].attributes.name;
    }
  }
  return "";
}

function getAuthor(relationships) { return getRelName(relationships, "author"); }
function getArtist(relationships) { return getRelName(relationships, "artist"); }

var UUID_RE = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;

function extractUUID(url) {
  var match = UUID_RE.exec(url);
  return match ? match[1] : url;
}

function parseMangaList(data) {
  if (!data || !data.data) return [];
  var books = [];
  for (var i = 0; i < data.data.length; i++) {
    var item = data.data[i];
    if (!item.attributes) continue;
    var cover = getCoverUrl(item.id, item.relationships, "256");
    var desc = getDescription(item.attributes.description);
    if (desc && desc.length > 150) desc = desc.substring(0, 150) + "…";
    books.push({
      name: getTitle(item.attributes.title),
      link: "/nettrom/truyen-tranh/" + item.id,
      host: BASE_URL,
      cover: cover,
      description: desc,
    });
  }
  return books;
}

function calcNextOffset(data) {
  if (!data || data.total == null) return null;
  var next = data.offset + data.limit;
  return next < data.total ? String(next) : null;
}

function parseTags(tags) {
  var genres = [];
  if (!tags) return genres;
  for (var i = 0; i < tags.length; i++) {
    if (!tags[i].attributes) continue;
    genres.push({ title: getTitle(tags[i].attributes.name), input: tags[i].id, script: "genrecontent.js" });
  }
  return genres;
}

function getAltTitles(altTitles) {
  if (!altTitles || !altTitles.length) return "";
  var result = "";
  for (var i = 0; i < altTitles.length; i++) {
    var keys = Object.keys(altTitles[i]);
    if (keys.length > 0) {
      if (result) result += ", ";
      result += altTitles[i][keys[0]];
    }
  }
  return result;
}

function getAuthorFull(relationships) {
  var author = getAuthor(relationships);
  var artist = getArtist(relationships);
  return (artist && artist !== author) ? author + " / " + artist : author;
}

function getGroupName(relationships) { return getRelName(relationships, "scanlation_group"); }

// Sentinel object — fetchRetry luôn trả non-null để callers dùng .ok trực tiếp
var FAIL_RESP = { ok: false, status: 0 };

function fetchRetry(url, options) {
  var r = options ? fetch(url, options) : fetch(url);
  if (r && r.ok) return r;
  // Proxy fail → thử gọi trực tiếp MangaDex API
  if (url.indexOf(API_URL) === 0) {
    var directUrl = API_FALLBACK + url.substring(API_URL.length);
    var r2 = options ? fetch(directUrl, options) : fetch(directUrl);
    if (r2 && r2.ok) return r2;
  }
  // Retry lần cuối (server error)
  if (!r || r.status >= 500) {
    return (options ? fetch(url, options) : fetch(url)) || FAIL_RESP;
  }
  return r || FAIL_RESP;
}

function getAuthorId(relationships) {
  if (!relationships) return "";
  for (var i = 0; i < relationships.length; i++) {
    if (relationships[i].type === "author") return relationships[i].id;
  }
  return "";
}

function buildChapterTitle(attr, groupName) {
  var title = "";
  if (attr.volume) title += "T" + attr.volume + " ";
  if (attr.chapter) title += "Ch. " + attr.chapter;
  if (attr.title) title += (title ? " - " : "") + attr.title;
  if (!title) title = "Oneshot";
  if (groupName) title += " [" + groupName + "]";
  return title;
}

function stripBBCode(text) {
  if (!text) return "";
  return text.replace(/\[\/?[a-z][^\]]*\]/gi, "").trim();
}

var STATUS_MAP = { "ongoing": "Đang tiến hành", "completed": "Hoàn thành", "hiatus": "Tạm ngưng", "cancelled": "Đã hủy" };
