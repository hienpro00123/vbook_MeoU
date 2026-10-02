load("config.js");

var MEDIA_HEADERS = {
  "User-Agent": FETCH_OPTIONS.headers["User-Agent"],
  "Accept-Language": FETCH_OPTIONS.headers["Accept-Language"]
};

function pickResourceUrl(resource) {
  if (!resource) return "";
  if (resource.url) return resource.url;
  return resource.backup_url && resource.backup_url.length ? resource.backup_url[0] : "";
}

function buildSubtitles(episodeId) {
  var result = [];
  var url = API_URL + "/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=" + episodeId + "&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return result;
  var payload;
  try { payload = response.json(); } catch (e) { return result; }
  var tracks = payload && payload.data && payload.data.video_subtitle ? payload.data.video_subtitle : [];
  var ordered = [];
  var i;
  for (i = 0; i < tracks.length; i++) if (tracks[i].lang_key === "vi") ordered.push(tracks[i]);
  for (i = 0; i < tracks.length; i++) if (tracks[i].lang_key !== "vi") ordered.push(tracks[i]);
  for (i = 0; i < ordered.length; i++) {
    var track = ordered[i];
    var subtitleUrl = track.ass && track.ass.url ? track.ass.url : "";
    if (!subtitleUrl) continue;
    var label = track.lang || track.lang_key || "Subtitle";
    result.push({
      data: subtitleUrl,
      url: subtitleUrl,
      type: "ass",
      title: label,
      label: label,
      language: track.lang_key || "",
      lang: track.lang_key || "",
      selected: track.lang_key === "vi",
      source: "bilibili.subtitle"
    });
  }
  return result;
}

function execute(data) {
  var episodeId = extractEpisodeId(data);
  if (!episodeId) return Response.error("Invalid BiliBili episode URL");
  var url = API_URL + "/playurl?s_locale=vi_VN&platform=web&ep_id=" + episodeId + "&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Unable to load BiliBili stream");
  var payload;
  try { payload = response.json(); } catch (e) { return Response.error("Invalid BiliBili playback response"); }
  if (!payload || payload.code !== 0 || !payload.data || !payload.data.playurl) return Response.error("BiliBili returned no playback data");

  var playurl = payload.data.playurl;
  var videos = playurl.video || [];
  var video = null;
  var videoUrl = "";
  for (var i = 0; i < videos.length; i++) {
    var candidate = pickResourceUrl(videos[i].video_resource);
    if (candidate) { video = videos[i].video_resource; videoUrl = candidate; break; }
  }
  if (!videoUrl) return Response.error("BiliBili returned no playable video URL");

  var audios = [];
  var audioResources = playurl.audio_resource || [];
  for (var j = 0; j < audioResources.length; j++) {
    var audioUrl = pickResourceUrl(audioResources[j]);
    if (audioUrl) audios.push({ data: audioUrl, type: "", label: "BiliBili AAC", language: "zh", headers: MEDIA_HEADERS });
  }

  var subtitles = [];
  try { subtitles = buildSubtitles(episodeId); } catch (subtitleError) { subtitles = []; }
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
