load("config.js");

function execute(url) {
  var response = fetchRetry(url);
  if (response.ok) {
    var json;
    try { json = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    var responseData = json.data;
    if (!responseData || !responseData.item) return Response.success([]);

    var chapters = responseData.item.chapters;
    if (!chapters || chapters.length === 0) return Response.success([]);

    // Chọn server có nhiều chương nhất — tránh mất chương khi server đầu có ít dữ liệu hơn
    var serverData = null;
    var bestLen = 0;
    for (var s = 0; s < chapters.length; s++) {
      var sd = chapters[s].server_data;
      if (sd && sd.length > bestLen) { serverData = sd; bestLen = sd.length; }
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
