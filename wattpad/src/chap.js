load("config.js");

function execute(url) {
  var match = url.match(/wattpad\.com\/(\d+)-/) || url.match(/wattpad\.com\/(\d+)(?:[?#]|$)/);
  if (!match) return Response.error("URL chương không hợp lệ");
  var chapId = match[1];
  // apiv2/storytext là endpoint duy nhất trả về HTML nội dung chương (v4 yêu cầu auth)
  var html = fetchWattpad(APIV2 + "/storytext?id=" + chapId);
  if (html) return Response.success(html);
  return Response.error("Không thể tải nội dung chương");
}
