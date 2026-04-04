var BASE_URL = "https://www.wattpad.com";
var API_V3 = BASE_URL + "/api/v3";
var API_V4 = BASE_URL + "/v4";
var APIV2 = BASE_URL + "/apiv2";
var LANG_VI = "19"; // Tiếng Việt (xác nhận từ Wattpad language select)

var OFFSET_RE = /offset=(\d+)/;
var STORY_ID_RE = /\/(\d+)-/;
var STORY_ID_RE2 = /\/(\d+)(?:[?#]|$)/;
var CHAP_ID_RE = /wattpad\.com\/(\d+)-/;
var CHAP_ID_RE2 = /wattpad\.com\/(\d+)(?:[?#]|$)/;

function extractStoryId(url) {
  var m = STORY_ID_RE.exec(url) || STORY_ID_RE2.exec(url);
  return m ? m[1] : null;
}

function extractChapId(url) {
  var m = CHAP_ID_RE.exec(url) || CHAP_ID_RE2.exec(url);
  return m ? m[1] : null;
}

var FETCH_OPTIONS = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "*/*",
  }
};

// Xây dựng URL với query params
function buildUrl(base, params) {
  if (!params) return base;
  var qs = [];
  for (var key in params) {
    qs.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
  }
  return qs.length > 0 ? base + "?" + qs.join("&") : base;
}

// Fetch JSON từ Wattpad API với retry 1 lần
function fetchWattpadJson(url, params) {
  var fullUrl = buildUrl(url, params);
  var res = fetch(fullUrl, FETCH_OPTIONS);
  if (!res || !res.ok) res = fetch(fullUrl, FETCH_OPTIONS);
  if (!res || !res.ok) return null;
  try { return res.json(); } catch (e) { return null; }
}

// Fetch nội dung chương HTML từ Wattpad (apiv2/storytext)
function fetchWattpadHtml(url) {
  var res = fetch(url, FETCH_OPTIONS);
  if (!res || !res.ok) res = fetch(url, FETCH_OPTIONS);
  if (!res || !res.ok) return null;
  try {
    var doc = res.html();
    var body = doc.select("body");
    return body.size() > 0 ? body.get(0).html() : doc.html();
  } catch (e) { return null; }
}

function parseStories(data) {
  if (!data || !data.stories || !data.stories.length) return Response.success([], null);
  var next = data.nextUrl ? OFFSET_RE.exec(data.nextUrl) : null;
  next = next ? next[1] : null;
  var list = [];
  data.stories.forEach(function (v) {
    if (!v.url) return; // bỏ qua truyện không có link
    list.push({
      name: v.title || "(Không có tên)",
      link: v.url,
      host: BASE_URL,
      cover: v.cover || "",
      description: v.user ? v.user.name : "",
    });
  });
  return Response.success(list, next);
}
