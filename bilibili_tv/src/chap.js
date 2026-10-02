load("config.js");

function execute(url) {
  if (!extractEpisodeId(url)) return Response.error("URL tap BiliBili khong hop le");
  return Response.success([{ title: "BiliBili", data: absoluteUrl(url) }]);
}
