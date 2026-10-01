var BASE_URL = "https://www.bilibili.tv";
var API_URL = "https://api.bilibili.tv/intl/gateway/web";
var FETCH_OPTIONS = { headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36", "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8", "Origin": BASE_URL, "Referer": BASE_URL + "/vi/" } };

function absoluteUrl(url) {
  if (!url) return "";
  if (url.indexOf("http") === 0) return url;
  if (url.indexOf("//") === 0) return "https:" + url;
  return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function extractEpisodeId(url) {
  var match = /\/vi\/(?:play|media)\/\d+\/(\d+)/.exec(url || "");
  return match ? match[1] : null;
}

function extractSeasonId(url) {
  var match = /\/vi\/(?:play|media)\/(\d+)/.exec(url || "");
  return match ? match[1] : null;
}
