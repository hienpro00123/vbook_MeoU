var BASE_URL = "https://api.mangadex.org";

function execute(chapterId) {
  chapterId = chapterId.replace(/\/$/, "").replace(/^\//,"");
  if (chapterId.indexOf("/") >= 0) {
    var parts = chapterId.split("/");
    chapterId = parts[parts.length - 1];
  }

  var response = fetch(BASE_URL + "/at-home/server/" + chapterId);
  if (response.ok) {
    var json = JSON.parse(response.text());
    var baseUrl = json.baseUrl;
    var hash = json.chapter.hash;
    var pages = json.chapter.dataSaver;
    if (!pages || pages.length === 0) {
      return Response.error("Chương này không có ảnh (có thể là link ngoài)");
    }

    var data = [];
    for (var i = 0; i < pages.length; i++) {
      data.push({
        link: baseUrl + "/data-saver/" + hash + "/" + pages[i],
        script: "image.js",
      });
    }
    return Response.success(data);
  }
  return Response.error("Không thể tải nội dung chương");
}
