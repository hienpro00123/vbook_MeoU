load("config.js");

function execute(url) {
  if (!extractEpisodeId(url)) return Response.error("URL tập BiliBili không hợp lệ");
  return Response.success([{ title: "BiliBili", data: absoluteUrl(url) }]);
}
