load("config.js");

function execute(url) {
  url = absoluteUrl(url);
  var seasonId = extractSeasonId(url);
  if (!seasonId) return Response.error("URL season BiliBili khong hop le");
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Khong tai duoc danh sach tap BiliBili");
  var html = response.text() || "";
  var doc = Html.parse(html);
  var links = doc.select("a[href*='/vi/play/']");
  var episodes = [];
  var seen = {};
  for (var i = 0; i < links.size(); i++) {
    var link = links.get(i);
    var episodeUrl = absoluteUrl(link.attr("href"));
    var episodeId = extractEpisodeId(episodeUrl);
    if (!episodeId || seen[episodeId]) continue;
    var seasonMatch = /\/vi\/(?:play|media)\/(\d+)\//.exec(episodeUrl);
    if (!seasonMatch || seasonMatch[1] !== seasonId) continue;
    seen[episodeId] = true;
    var name = (link.text() || "").trim();
    if (!name) name = "Tap " + String(episodes.length + 1);
    episodes.push({ name: name, url: episodeUrl, host: BASE_URL, description: "", lock: false, pay: false });
  }
  if (!episodes.length) return Response.error("Khong tim thay tap trong trang BiliBili");
  return Response.success(episodes);
}
