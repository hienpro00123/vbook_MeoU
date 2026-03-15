load("config.js");

function execute(url) {
  var response = fetch(url);
  if (response.ok) {
    var json = response.json();
    var responseData = json.data;
    if (!responseData || !responseData.item) return Response.success([]);

    var chapters = responseData.item.chapters;
    if (!chapters || chapters.length === 0) return Response.success([]);

    // Tìm server đầu tiên có dữ liệu
    var serverData = null;
    for (var s = 0; s < chapters.length; s++) {
      if (chapters[s].server_data && chapters[s].server_data.length > 0) {
        serverData = chapters[s].server_data;
        break;
      }
    }
    if (!serverData) return Response.success([]);

    var result = [];
    for (var i = 0; i < serverData.length; i++) {
      var chap = serverData[i];
      var chapName = "Chương " + chap.chapter_name;
      if (chap.chapter_title && chap.chapter_title !== "") {
        chapName += ": " + chap.chapter_title;
      }
      result.push({
        name: chapName,
        url: chap.chapter_api_data,
      });
    }
    return Response.success(result);
  }
  return Response.error("Không thể tải mục lục");
}
