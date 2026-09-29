load("config.js");

function episodeNumber(name) {
  var match = /(\d+)/.exec(name || "");
  return match ? parseInt(match[1], 10) : 0;
}

function addVisibleEpisodes(html, seasonId, episodesByNumber) {
  var pattern = /<a\b[^>]*class="[^"]*\bep-item\b[^"]*"[^>]*>[\s\S]*?<\/a>/g;
  var match;
  var maxNumber = 0;
  while ((match = pattern.exec(html)) !== null) {
    var hrefMatch = /href="([^"]+)"/.exec(match[0]);
    var text = match[0].replace(/<[^>]+>/g, " ");
    var number = episodeNumber(text);
    if (!hrefMatch || !number || episodesByNumber[number]) continue;
    episodesByNumber[number] = {
      name: "Tập " + number,
      url: absoluteUrl(hrefMatch[1]),
      host: BASE_URL
    };
    if (number > maxNumber) maxNumber = number;
  }
  return maxNumber;
}

function addEmbeddedEpisodes(html, seasonId, episodesByNumber) {
  if (!html || !seasonId) return;
  var pattern = /episode_id\s*:\s*"(\d+)"[\s\S]{0,300}?short_title_display\s*:\s*"([^"]*)"/g;
  var match;
  var maxNumber = 0;
  while ((match = pattern.exec(html)) !== null) {
    if (/retake/i.test(match[2])) continue;
    var numberMatch = /(\d+)/.exec(match[2]);
    var number = numberMatch ? parseInt(numberMatch[1], 10) : 0;
    if (!number || episodesByNumber[number]) continue;
    var episodeUrl = BASE_URL + "/vi/play/" + seasonId + "/" + match[1];
    episodesByNumber[number] = { name: "Tập " + number, url: episodeUrl, host: BASE_URL };
    if (number > maxNumber) maxNumber = number;
  }
  return maxNumber;
}

function execute(url) {
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể tải danh sách tập");
  var html = response.text();
  if (!html) return Response.error("Danh sách tập BiliBili trống");

  var seasonId = extractSeasonId(url);
  if (!seasonId) return Response.error("URL mùa BiliBili không hợp lệ");
  var episodesByNumber = {};
  var maxNumber = addEmbeddedEpisodes(html, seasonId, episodesByNumber) || 0;
  var visibleMax = addVisibleEpisodes(html, seasonId, episodesByNumber);
  if (visibleMax > maxNumber) maxNumber = visibleMax;

  var result = [];
  for (var number = 1; number <= maxNumber; number++) {
    if (episodesByNumber[number]) result.push(episodesByNumber[number]);
  }
  if (result.length === 0) return Response.error("Không tìm thấy tập trong trang BiliBili");
  return Response.success(result);
}
