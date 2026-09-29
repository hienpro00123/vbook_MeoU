load("config.js");

function execute(key, page) {
  if (!key) return Response.success([], null);
  var url = BASE_URL + "/vi/search?keyword=" + encodeURIComponent(key);
  var doc = fetchDocument(url);
  if (!doc) return Response.error("Không thể tìm kiếm trên BiliBili");
  return Response.success(parseVideoCards(doc), null);
}
