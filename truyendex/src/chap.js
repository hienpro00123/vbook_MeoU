var API_URL = "https://api.mangadex.org";
var IMAGE_CDN = "https://uploads.mangadex.org";
var PROXY_URL = "https://services.f-ck.me/v1/image/";

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

function extractUUID(url) {
  var match = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i.exec(url);
  return match ? match[1] : url;
}

function execute(url) {
  var chapterId = extractUUID(url);
  var response = fetch(API_URL + "/at-home/server/" + chapterId + "?forcePort443=true");
  if (response.ok) {
    var data = response.json();
    if (!data || !data.chapter) return Response.error("Dữ liệu chương không hợp lệ");
    var hash = data.chapter.hash;
    if (!hash) return Response.error("Chương này không có ảnh trên MangaDex");

    // Prefer dataSaver (80-200KB) over full data (2-12MB) for mobile stability
    var pages = data.chapter.dataSaver;
    var quality = "data-saver";
    if (!pages || pages.length === 0) { pages = data.chapter.data; quality = "data"; }
    if (!pages || pages.length === 0) return Response.error("Không có ảnh");

    var prefix = (data.baseUrl || IMAGE_CDN) + "/" + quality + "/" + hash + "/";
    var images = [];
    for (var i = 0; i < pages.length; i++) {
      images.push({ link: proxyImage(prefix + pages[i]) });
    }
    return Response.success(images);
  }
  return Response.error("Không thể tải nội dung chương");
}
