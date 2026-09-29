load("config.js");

function execute(path, page) {
  var url = path || "/vi/anime";
  var doc = fetchDocument(absoluteUrl(url));
  if (!doc) return Response.error("Không thể tải danh sách BiliBili");
  return Response.success(parseVideoCards(doc), null);
}
