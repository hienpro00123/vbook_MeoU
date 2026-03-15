load("config.js");

function execute(url) {
  var chapId = url.match(/wattpad\.com\/(\d+)-/)[1];
  var html = Http.get(APIV2 + "/storytext?id=" + chapId).string();
  if (html) {
    return Response.success(html);
  }
  return null;
}
