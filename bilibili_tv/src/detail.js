load("config.js");

function countEpisodes(html) {
  var records = html.split("episode_id:");
  var seen = {};
  var count = 0;
  for (var i = 1; i < records.length; i++) {
    var record = records[i];
    var id = /^\s*"(\d+)"/.exec(record);
    if (!id || !/short_title_display\s*:\s*"[^"]*"/.test(record) || seen[id[1]]) continue;
    seen[id[1]] = true;
    count++;
  }

  var links = /<a\b[^>]*class="[^"]*\bep-item\b[^"]*"[^>]*>/g;
  var link;
  while ((link = links.exec(html)) !== null) {
    var href = /href="([^"]+)"/.exec(link[0]);
    if (!href) continue;
    var episodeId = extractEpisodeId(absoluteUrl(href[1]));
    if (!episodeId || seen[episodeId]) continue;
    seen[episodeId] = true;
    count++;
  }
  return count;
}

function getOngoing(doc, seasonId) {
  var cards = doc.select(".series__list .series__card");
  for (var i = 0; i < cards.size(); i++) {
    var card = cards.get(i);
    var links = card.select("a[href*='/play/'], a[href*='/media/']");
    var isCurrentSeason = false;
    for (var j = 0; j < links.size(); j++) {
      if (extractSeasonId(absoluteUrl(elementAttr(links.get(j), "href"))) === seasonId) {
        isCurrentSeason = true;
        break;
      }
    }
    if (!isCurrentSeason) continue;

    var status = card.select(".bstar-video-card__cover-mask-text, .video-card__cover-mask-text").text();
    if (status.indexOf("Trọn bộ") >= 0 || status.toLowerCase().indexOf("completed") >= 0) return false;
    return true;
  }
  return true;
}

function execute(url) {
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể tải thông tin video");
  var html = response.text();
  if (!html) return Response.error("Trang thông tin BiliBili trống");
  var doc = Html.parse(html);

  var titleMeta = doc.select("meta[property='og:title']");
  var imageMeta = doc.select("meta[property='og:image']");
  var descriptionMeta = doc.select("meta[name='description']");
  var mediaLinks = doc.select("a[href*='/media/']");
  var name = mediaLinks.size() > 0 ? mediaLinks.get(0).text().trim() : "BiliBili Anime";
  if ((!name || name === "BiliBili Anime") && titleMeta.size() > 0) name = titleMeta.get(0).attr("content");

  var episodeCount = countEpisodes(html);
  var description = descriptionMeta.size() > 0 ? descriptionMeta.get(0).attr("content") : "";
  var cover = imageMeta.size() > 0 ? imageMeta.get(0).attr("content") : "";
  var seasonId = extractSeasonId(url);
  var tags = doc.select("a.bstar-meta-tag[href]");
  var genres = [];
  for (var i = 0; i < tags.size(); i++) {
    var tag = tags.get(i);
    var tagName = tag.text().trim();
    var tagUrl = elementAttr(tag, "href");
    if (!tagName || tagName === "Anime" || !tagUrl) continue;
    genres.push({ title: tagName, input: absoluteUrl(tagUrl), script: "homecontent.js" });
  }
  var recommendCards = doc.select(".recommends__list .recommends__card a.bstar-video-card__title-text[href*='/play/']");
  var suggests = recommendCards.size() > 0 ? [{ title: "Đề xuất cho bạn", input: absoluteUrl(url), script: "suggest.js" }] : [];

  return Response.success({
    name: name,
    cover: cover,
    host: BASE_URL,
    type: "video",
    format: "series",
    author: "BiliBili",
    description: description,
    detail: episodeCount > 0 ? episodeCount + " tập" : "Anime",
    ongoing: getOngoing(doc, seasonId),
    genres: genres,
    suggests: suggests
  });
}
