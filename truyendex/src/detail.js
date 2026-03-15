var BASE_URL = "https://truyendex.cc";
var API_URL = "https://api.mangadex.org";
var COVER_BASE = "https://uploads.mangadex.org/covers";
var PROXY_URL = "https://services.f-ck.me/v1/image/";
var LANGUAGE = "vi";
var STATUS_MAP = { "ongoing": "Đang tiến hành", "completed": "Hoàn thành", "hiatus": "Tạm ngưng", "cancelled": "Đã hủy" };

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

function getRelName(relationships, type) {
  if (!relationships) return "";
  for (var i = 0; i < relationships.length; i++) {
    if (relationships[i].type === type && relationships[i].attributes) {
      return relationships[i].attributes.name;
    }
  }
  return "";
}

function extractUUID(url) {
  var match = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i.exec(url);
  return match ? match[1] : url;
}

function parseTags(tags) {
  var genres = [];
  if (!tags) return genres;
  for (var i = 0; i < tags.length; i++) {
    genres.push({ title: getLocalized(tags[i].attributes.name), input: tags[i].id, script: "genrecontent.js" });
  }
  return genres;
}

function getAltTitles(altTitles) {
  if (!altTitles || !altTitles.length) return "";
  var names = [];
  for (var i = 0; i < altTitles.length; i++) {
    var keys = Object.keys(altTitles[i]);
    if (keys.length > 0) names.push(altTitles[i][keys[0]]);
  }
  return names.join(", ");
}

function getAuthorFull(relationships) {
  var author = getRelName(relationships, "author");
  var artist = getRelName(relationships, "artist");
  return (artist && artist !== author) ? author + " / " + artist : author;
}

function stripBBCode(text) {
  if (!text) return "";
  return text.replace(/\[\/?[a-z][^\]]*\]/gi, "").trim();
}

function execute(url) {
  var mangaId = extractUUID(url);

  var response = fetch(API_URL + "/manga/" + mangaId + "?includes[]=artist&includes[]=author&includes[]=cover_art");
  if (response.ok) {
    var data = response.json();
    if (!data || !data.data) return Response.error("Dữ liệu truyện không hợp lệ");
    var attributes = data.data.attributes;
    var relationships = data.data.relationships;

    var cover = getCoverUrl(mangaId, relationships, "512");
    var author = getAuthorFull(relationships);

    var genres = parseTags(attributes.tags);

    var details = [];
    var altNames = getAltTitles(attributes.altTitles);
    if (altNames) details.push("Tên khác: " + altNames);
    if (attributes.status && STATUS_MAP[attributes.status]) details.push("Trạng thái: " + STATUS_MAP[attributes.status]);
    if (attributes.year) details.push("Năm: " + attributes.year);

    return Response.success({
      name: getLocalized(attributes.title),
      cover: cover,
      host: BASE_URL,
      author: author,
      description: stripBBCode(getLocalized(attributes.description)),
      detail: details.join("\n"),
      ongoing: attributes.status === "ongoing",
      genres: genres,
      suggests: genres.length > 0 ? [{ title: "Truyện cùng thể loại", input: genres[0].input, script: "suggest.js" }] : [],
    });
  }
  return Response.error("Không thể tải thông tin truyện");
}
