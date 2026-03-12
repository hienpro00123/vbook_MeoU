load("config.js");

function execute(url) {
  var apiUrl = url;
  if (url.indexOf("otruyenapi.com") < 0) {
    var slug = url;
    var idx = url.indexOf("/truyen-tranh/");
    if (idx >= 0) {
      slug = url.substring(idx + 14);
    }
    slug = slug.replace(/\/$/, "").replace(/^\//,"");
    if (slug.indexOf("http") === 0) {
      var parts = slug.split("/");
      slug = parts[parts.length - 1];
    }
    apiUrl = BASE_URL + "/truyen-tranh/" + slug;
  }

  var response = fetch(apiUrl);
  if (response.ok) {
    var json = JSON.parse(response.text());
    var responseData = json.data;
    if (!responseData || !responseData.item) return Response.success([]);
    var item = responseData.item;

    var chapters = item.chapters;
    if (!chapters || chapters.length === 0) return Response.success([]);

    var server = chapters[0];
    var serverData = server.server_data;
    if (!serverData || serverData.length === 0) return Response.success([]);

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
