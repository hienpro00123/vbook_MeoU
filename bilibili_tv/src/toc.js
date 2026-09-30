load("config.js");

function episodeNumber(name) {
  var match = /(\d+)/.exec(name || "");
  return match ? parseInt(match[1], 10) : 0;
}

function getEpisodeName(record, number, shortTitle) {
  var display = /(?:^|,)title_display\s*:\s*"([^"]*)"/.exec(record);
  if (display && display[1]) return display[1];

  var longTitle = /long_title_display\s*:\s*"([^"]*)"/.exec(record);
  var title = longTitle ? longTitle[1].trim() : "";
  var label = /retake/i.test(shortTitle) ? shortTitle.trim() : "Tập " + number;
  return title ? label + " - " + title : label;
}

function makeSection(title) {
  return { title: title, episodes: [], episodeIds: {} };
}

function findSection(sections, title) {
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].title === title) return sections[i];
  }
  return null;
}

function getSectionForVisibleEpisode(sections, number, isRetake) {
  for (var i = 0; i < sections.length; i++) {
    var section = sections[i];
    if (/retake/i.test(section.title) !== isRetake) continue;
    var values = section.title.match(/\d+/g);
    if (!values || values.length < 2) continue;
    if (number >= parseInt(values[0], 10) && number <= parseInt(values[1], 10)) return section;
  }
  return sections.length > 0 ? sections[0] : null;
}

function addEmbeddedSections(html, seasonId, sections) {
  var groups = html.split("ep_list_title:");
  for (var i = 1; i < groups.length; i++) {
    var titleMatch = /^\s*"([^"]+)"/.exec(groups[i]);
    if (!titleMatch) continue;
    var title = titleMatch[1];
    var section = findSection(sections, title);
    if (!section) {
      section = makeSection(title);
      sections.push(section);
    }

    var records = groups[i].split("episode_id:");
    for (var j = 1; j < records.length; j++) {
      var record = records[j];
      var idMatch = /^\s*"(\d+)"/.exec(record);
      if (!idMatch || section.episodeIds[idMatch[1]]) continue;
      var shortTitleMatch = /short_title_display\s*:\s*"([^"]*)"/.exec(record);
      if (!shortTitleMatch) continue;
      var shortTitle = shortTitleMatch[1];
      var number = episodeNumber(shortTitle);
      if (!number) continue;
      section.episodeIds[idMatch[1]] = true;
      section.episodes.push({
        name: getEpisodeName(record, number, shortTitle),
        url: BASE_URL + "/vi/play/" + seasonId + "/" + idMatch[1],
        host: BASE_URL
      });
    }
  }
}

function addVisibleEpisodes(html, sections) {
  var pattern = /<a\b[^>]*class="[^"]*\bep-item\b[^"]*"[^>]*>[\s\S]*?<\/a>/g;
  var match;
  while ((match = pattern.exec(html)) !== null) {
    var hrefMatch = /href="([^"]+)"/.exec(match[0]);
    if (!hrefMatch) continue;
    var url = absoluteUrl(hrefMatch[1]);
    var idMatch = /\/vi\/play\/\d+\/(\d+)/.exec(url);
    if (!idMatch) continue;
    var text = match[0].replace(/<[^>]+>/g, " ");
    var titleMatch = /title="([^"]+)"/.exec(match[0]);
    var number = episodeNumber(text);
    if (!number) continue;
    var isRetake = /retake/i.test(text);
    var section = getSectionForVisibleEpisode(sections, number, isRetake);
    if (!section || section.episodeIds[idMatch[1]]) continue;
    section.episodeIds[idMatch[1]] = true;
    section.episodes.push({
      name: titleMatch ? "Tập " + number + " - " + titleMatch[1] : "Tập " + number,
      url: url,
      host: BASE_URL,
      number: number
    });
  }
}

function execute(url) {
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể tải danh sách tập");
  var html = response.text();
  if (!html) return Response.error("Danh sách tập BiliBili trống");

  var seasonId = extractSeasonId(url);
  if (!seasonId) return Response.error("URL mùa BiliBili không hợp lệ");
  var sections = [];
  addEmbeddedSections(html, seasonId, sections);
  addVisibleEpisodes(html, sections);
  var result = [];
  for (var i = 0; i < sections.length; i++) {
    var section = sections[i];
    if (section.episodes.length === 0) continue;
    result.push({ type: "section", name: section.title });
    for (var j = 0; j < section.episodes.length; j++) {
      result.push(section.episodes[j]);
    }
  }
  if (result.length === 0) return Response.error("Không tìm thấy tập trong trang BiliBili");
  return Response.success(result);
}
