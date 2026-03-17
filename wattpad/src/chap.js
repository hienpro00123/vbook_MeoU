load("config.js");

function execute(url) {
  var match = url.match(/wattpad\.com\/(\d+)-/);
  if (!match) return Response.error("URL chương không hợp lệ");
  var chapId = match[1];
  var html = Http.get(APIV2 + "/storytext?id=" + chapId).string();
  if (!html) html = Http.get(APIV2 + "/storytext?id=" + chapId).string();
  if (html) {
    return Response.success(html);
  }
  return Response.error("Không thể tải nội dung chương");
}
