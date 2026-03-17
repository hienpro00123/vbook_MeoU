load("config.js");

function execute(url) {
  var response = fetchRetry(url);
  if (response.ok) {
    var json;
    try { json = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    var chapterData = json && json.data;
    if (!chapterData) return Response.error("Dữ liệu chương không hợp lệ");
    var chapterItem = chapterData.item;
    if (!chapterItem || !chapterItem.chapter_image) return Response.error("Không có ảnh chương");
    if (!chapterItem.chapter_path) return Response.error("Không có đường dẫn ảnh chương");
    var images = chapterItem.chapter_image;
    var cdn = chapterData.domain_cdn || chapterData.domain_cdn_backup || "https://sv1.otruyencdn.com";
    var prefix = cdn + "/" + chapterItem.chapter_path + "/";

    var data = [];
    for (var i = 0; i < images.length; i++) {
      data.push({ link: prefix + images[i].image_file });
    }
    return Response.success(data);
  }
  return Response.error("Không thể tải nội dung chương");
}
