load("config.js");

function execute(url) {
  var slug = url.replace(/.*\/truyen-tranh\//, "").replace(/\/$/, "");

  var response = fetch(BASE_URL + "/truyen-tranh/" + slug);
  if (response.ok) {
    var json = response.json();
    var item = json.data.item;
    var chapters = item.chapters;

    var data = [];
    if (chapters && chapters.length > 0) {
      var serverData = chapters[0].server_data;
      for (var i = 0; i < serverData.length; i++) {
        var chap = serverData[i];
        var chapName = "Chương " + chap.chapter_name;
        if (chap.chapter_title) {
          chapName += ": " + chap.chapter_title;
        }
        data.push({
          name: chapName,
          url: chap.chapter_api_data,
        });
      }
    }
    return Response.success(data);
  }
  return Response.error("Không thể tải mục lục");
}
