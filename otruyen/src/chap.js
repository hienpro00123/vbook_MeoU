function execute(url) {
  var response = fetch(url);
  if (response.ok) {
    var json = response.json();
    var chapterData = json && json.data;
    if (!chapterData) return Response.error("Dữ liệu chương không hợp lệ");
    var chapterItem = chapterData.item;
    if (!chapterItem || !chapterItem.chapter_image) return Response.error("Không có ảnh chương");
    var images = chapterItem.chapter_image;
    var prefix = chapterData.domain_cdn + "/" + chapterItem.chapter_path + "/";

    var data = [];
    for (var i = 0; i < images.length; i++) {
      data.push({ link: prefix + images[i].image_file });
    }
    return Response.success(data);
  }
  return Response.error("Không thể tải nội dung chương");
}
