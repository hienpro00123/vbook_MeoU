load("config.js");

// track.js - resolve an episode to a playable stream.
// Verified via DevTools: playurl needs qn=64 + spm_id to return code 0.
// Subtitle v2 API gives both an "ass" resource (real playable HTTP file) and a
// "srt" resource (JSON cue list, not an actual .srt/.vtt file). Only the ass
// url is a ready-to-use subtitle resource, so that is what gets returned here -
// never a generated data: URI, since the player only loads real http(s) files.

var MEDIA_HEADERS = {
  "User-Agent": FETCH_OPTIONS.headers["User-Agent"],
  "Accept-Language": FETCH_OPTIONS.headers["Accept-Language"]
};

function pickResourceUrl(resource) {
  if (!resource) return "";
  if (resource.url) return resource.url;
  if (resource.backup_url && resource.backup_url.length > 0) return resource.backup_url[0];
  return "";
}

function fetchSubtitleTracks(episodeId) {
  var tracks = [];
  var url = API_URL + "/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=" + episodeId +
    "&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return tracks;

  var payload;
  try { payload = response.json(); } catch (parseError) { return tracks; }
  var items = payload && payload.data && payload.data.video_subtitle ? payload.data.video_subtitle : [];

  var ordered = [];
  var i;
  for (i = 0; i < items.length; i++) { if (items[i].lang_key === "vi") ordered.push(items[i]); }
  for (i = 0; i < items.length; i++) { if (items[i].lang_key !== "vi") ordered.push(items[i]); }

  for (i = 0; i < ordered.length; i++) {
    var item = ordered[i];
    var subtitleUrl = item.ass && item.ass.url ? item.ass.url : "";
    if (!subtitleUrl) continue;
    var label = item.lang || item.lang_key || "Subtitle";
    tracks.push({
      data: subtitleUrl,
      url: subtitleUrl,
      type: "ass",
      title: label,
      label: label,
      language: item.lang_key || "",
      lang: item.lang_key || "",
      selected: item.lang_key === "vi",
      source: "bilibili.subtitle"
    });
  }
  return tracks;
}

function execute(data) {
  var episodeId = extractEpisodeId(data);
  if (!episodeId) return Response.error("URL tap BiliBili khong hop le");

  var playUrl = API_URL + "/playurl?s_locale=vi_VN&platform=web&ep_id=" + episodeId +
    "&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(playUrl, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Khong the lay luong phat BiliBili");

  var payload;
  try { payload = response.json(); } catch (parseError) { return Response.error("Phan hoi BiliBili khong hop le"); }
  if (!payload || payload.code !== 0 || !payload.data || !payload.data.playurl) {
    return Response.error("BiliBili khong tra du lieu phat");
  }

  var playurl = payload.data.playurl;
  var videos = playurl.video || [];
  var video = null;
  var videoUrl = "";
  for (var i = 0; i < videos.length; i++) {
    var candidate = pickResourceUrl(videos[i].video_resource);
    if (candidate) {
      video = videos[i].video_resource;
      videoUrl = candidate;
      break;
    }
  }
  if (!videoUrl) return Response.error("BiliBili khong co URL video kha dung");

  var audios = [];
  var audioResources = playurl.audio_resource || [];
  for (var j = 0; j < audioResources.length; j++) {
    var audioUrl = pickResourceUrl(audioResources[j]);
    if (audioUrl) {
      audios.push({ data: audioUrl, type: "", label: "BiliBili AAC", language: "zh", headers: MEDIA_HEADERS });
    }
  }

  var subtitles = [];
  try { subtitles = fetchSubtitleTracks(episodeId); } catch (subtitleError) { subtitles = []; }

  return Response.success({
    type: "native",
    data: videoUrl,
    mimeType: video.mime_type || "video/mp4",
    headers: { "User-Agent": MEDIA_HEADERS["User-Agent"], "Referer": absoluteUrl(data) },
    audios: audios,
    subtitles: subtitles,
    subtitleTracks: subtitles
  });
}
