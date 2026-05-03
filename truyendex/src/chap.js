load("config.js");

function execute(url) {
  var chapterId = extractUUID(url);

  // Thử forcePort443=true trước; nếu API lỗi → fallback sang false
  var response = fetchRetry(API_URL + "/at-home/server/" + chapterId + "?forcePort443=true");
  if (!response.ok) {
    response = fetchRetry(API_URL + "/at-home/server/" + chapterId + "?forcePort443=false");
  }

  if (response.ok) {
    var data;
    try { data = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    if (!data || data.result !== "ok") return Response.error("MangaDex at-home trả về lỗi");
    if (!data.chapter) return Response.error("Dữ liệu chương không hợp lệ");

    var hash = data.chapter.hash;
    if (!hash) return Response.error("Chương này không có ảnh trên MangaDex");

    // Ưu tiên dataSaver (80–200 KB) thay vì full data (2–12 MB) — tối ưu cho mạng di động
    var pages = data.chapter.dataSaver;
    var quality = "data-saver";
    if (!pages || pages.length === 0) { pages = data.chapter.data; quality = "data"; }
    if (!pages || pages.length === 0) return Response.error("Chương không có ảnh");

    var baseUrl = data.baseUrl || IMAGE_CDN;
    var prefix = baseUrl + "/" + quality + "/" + hash + "/";
    var images = [];
    for (var i = 0; i < pages.length; i++) {
        var pageUrl = prefix + pages[i];
        // SÆ° phá»¥ mangadex nÃ³ Ä‘Ã£ Ä‘á»•i domain load image háº§u háº¿t qua uploads -> proxy lÃ  xong
        // Proxy áº£nh qua f-ck.me theo thá»§ thuáº­t proxy truyendex.cc hoÆ¡c trÆ°á»›c Ä‘Ã³ proxyImage module config.js
        images.push({ link: proxyImage(pageUrl) });
    }
    return Response.success(images);
  }
  return Response.error("Không thể tải nội dung chương từ MangaDex");
}
