var BASE_URL = "https://truyendex.cc";
var API_URL = "https://api.mangadex.org";
var API_FALLBACK = "https://api-proxy.truyendex.cc/mangadex";
var COVER_BASE = "https://uploads.mangadex.org/covers";
var IMAGE_CDN = "https://uploads.mangadex.org";
var LANGUAGE = "vi";
var CONTENT_RATING = "contentRating[]=safe&contentRating[]=suggestive";
var FEED_CONTENT_RATING = "contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic";
var MANGA_PARAMS = "includes[]=cover_art&availableTranslatedLanguage[]=vi&hasAvailableChapters=true&" + CONTENT_RATING;
var MANGA_LIST_PARAMS = MANGA_PARAMS;
var VI_CHAPTER_CACHE_TTL = 6 * 60 * 60 * 1000;

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
      return url;
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

function hasVietnameseChapters(mangaId) {
  var cacheKey = "truyendex:vi-chapters:v1:" + mangaId;
  var cachedValue = "";
  try {
    cachedValue = cacheStorage.getItem(cacheKey);
  } catch (e) {
    if (typeof Log !== "undefined") Log.log("TruyenDex chapter cache read failed: " + e);
  }
  if (cachedValue) {
    try {
      var cached = JSON.parse(cachedValue);
      if (cached && cached.expires > Date.now() && typeof cached.available === "boolean") {
        return cached.available;
      }
    } catch (e) {
      if (typeof Log !== "undefined") Log.log("TruyenDex chapter cache is invalid: " + e);
    }
  }

  var response = fetchRetry(API_URL + "/manga/" + mangaId + "/feed?translatedLanguage[]=vi&limit=1");
  if (!response.ok) return null;

  var data;
  try { data = response.json(); } catch (e) { return null; }
  if (!data || !data.data || typeof data.total !== "number") return null;

  var available = data.total > 0;
  try {
    cacheStorage.setItem(cacheKey, JSON.stringify({
      expires: Date.now() + VI_CHAPTER_CACHE_TTL,
      available: available
    }));
  } catch (e) {
    if (typeof Log !== "undefined") Log.log("TruyenDex chapter cache write failed: " + e);
  }
  return available;
}

function parseMangaList(data) {
  if (!data || !data.data) return [];
  var books = [];
  for (var i = 0; i < data.data.length; i++) {
    var item = data.data[i];
    if (!item.attributes) continue;
    var hasVietnamese = hasVietnameseChapters(item.id);
    if (hasVietnamese === null) return null;
    if (!hasVietnamese) continue;
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
  var requestOptions = options || {
    headers: {
      "User-Agent": "vBook/1.0",
      "Accept": "application/json",
    }
  };
  var r = fetch(url, requestOptions);
  if (r && r.ok) return r;
  // MangaDex direct failure → fall back to the TruyenDex proxy
  if (url.indexOf(API_URL) === 0) {
    var directUrl = API_FALLBACK + url.substring(API_URL.length);
    var r2 = fetch(directUrl, requestOptions);
    if (r2 && r2.ok) return r2;
  }
  // Retry once after a server error
  if (!r || r.status >= 500) {
    return fetch(url, requestOptions) || FAIL_RESP;
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
