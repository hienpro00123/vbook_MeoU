function execute(url) {
  var response = fetch(url);
  if (response.ok) {
    var json = response.json();
    var chapterData = json.data;
    var chapterItem = chapterData.item;
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
