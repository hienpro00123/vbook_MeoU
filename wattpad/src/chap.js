load("config.js");

function execute(url) {
  var chapId = extractChapId(url);
  if (!chapId) return Response.error("URL chương không hợp lệ");
  // apiv2/storytext là endpoint duy nhất trả về HTML nội dung chương (v4 yêu cầu auth)
  var html = fetchWattpadHtml(APIV2 + "/storytext?id=" + chapId);
  if (html) return Response.success(html);
  return Response.error("Không thể tải nội dung chương");
}
