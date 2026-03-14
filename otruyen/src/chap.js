var BASE_URL = "https://otruyenapi.com/v1/api";

function execute(url) {
  var response = fetch(url);
  if (response.ok) {
    var json = response.json();
    var chapterData = json.data;
    var domainCdn = chapterData.domain_cdn;
    var chapterItem = chapterData.item;
    var chapterPath = chapterItem.chapter_path;
    var images = chapterItem.chapter_image;

    var data = [];
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var imageUrl = domainCdn + "/" + chapterPath + "/" + img.image_file;
      data.push({
        link: imageUrl,
      });
    }
    return Response.success(data);
  }
  return Response.error("Không thể tải nội dung chương");
}
