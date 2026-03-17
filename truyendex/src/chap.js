load("config.js");

function execute(url) {
  var chapterId = extractUUID(url);
  var response = fetchRetry(API_URL + "/at-home/server/" + chapterId + "?forcePort443=true");
  if (response.ok) {
    var data;
    try { data = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    if (!data || !data.chapter) return Response.error("Dữ liệu chương không hợp lệ");
    var hash = data.chapter.hash;
    if (!hash) return Response.error("Chương này không có ảnh trên MangaDex");

    // Prefer dataSaver (80-200KB) over full data (2-12MB) for mobile stability
    var pages = data.chapter.dataSaver;
    var quality = "data-saver";
    if (!pages || pages.length === 0) { pages = data.chapter.data; quality = "data"; }
    if (!pages || pages.length === 0) return Response.error("Không có ảnh");

    // Dùng trực tiếp MangaDex at-home CDN, không qua proxy để tăng tốc trên mọạng di động
    var baseUrl = data.baseUrl || IMAGE_CDN;
    var prefix = baseUrl + "/" + quality + "/" + hash + "/";
    var images = [];
    for (var i = 0; i < pages.length; i++) {
      images.push({ link: prefix + pages[i] });
    }
    return Response.success(images);
  }
  return Response.error("Không thể tải nội dung chương");
}
