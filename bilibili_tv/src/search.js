load("config.js");

function execute(key, page) {
  if (!key) return Response.success([], null);
  var pageNumber = 1;
  var queryId = "";
  var pageToken = page || "1";
  var separator = pageToken.indexOf("|");
  if (separator >= 0) {
    pageNumber = parseInt(pageToken.substring(0, separator), 10) || 1;
    queryId = pageToken.substring(separator + 1);
  } else {
    pageNumber = parseInt(pageToken, 10) || 1;
  }

  var url = API_URL + "/v2/search_v2/anime?s_locale=vi_VN&platform=web"
    + "&keyword=" + encodeURIComponent(key)
    + "&highlight=1&pn=" + pageNumber + "&ps=20&qid=" + encodeURIComponent(queryId)
    + "&sort=0&duration_type=0";
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể tìm kiếm trên BiliBili");

  try {
    var payload = response.json();
    if (!payload || payload.code !== 0 || !payload.data) {
      return Response.error("BiliBili không trả kết quả tìm kiếm");
    }
    var sourceItems = payload.data.items || [];
    var items = [];
    for (var i = 0; i < sourceItems.length; i++) {
      var item = sourceItems[i];
      if (!item.season_id || !item.title) continue;
      items.push({
        name: item.title,
        link: BASE_URL + "/vi/play/" + item.season_id,
        host: BASE_URL,
        cover: item.cover || "",
        description: item.description || ""
      });
    }
    var next = payload.data.has_next ? String(pageNumber + 1) + "|" + payload.data.qid : "";
    return Response.success(items, next);
  } catch (e) {
    return Response.error("Không thể phân tích kết quả tìm kiếm BiliBili");
  }
}
