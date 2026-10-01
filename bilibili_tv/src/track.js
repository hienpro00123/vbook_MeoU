load("config.js");

var MEDIA_HEADERS = {
  "User-Agent": FETCH_OPTIONS.headers["User-Agent"],
  "Accept-Language": FETCH_OPTIONS.headers["Accept-Language"]
};

function resourceUrl(resource) {
  if (!resource) return "";
  if (resource.url) return resource.url;
  return resource.backup_url && resource.backup_url.length ? resource.backup_url[0] : "";
}

function timecode(seconds) {
  var value = Math.round(parseFloat(seconds) * 1000);
  var hours = Math.floor(value / 3600000);
  var minutes = Math.floor(value % 3600000 / 60000);
  var secondsPart = Math.floor(value % 60000 / 1000);
  var milliseconds = value % 1000;
  return (hours < 10 ? "0" : "") + hours + ":" +
    (minutes < 10 ? "0" : "") + minutes + ":" +
    (secondsPart < 10 ? "0" : "") + secondsPart + "." +
    (milliseconds < 10 ? "00" : milliseconds < 100 ? "0" : "") + milliseconds;
}

function subtitleVtt(url) {
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return "";
  var payload;
  try { payload = response.json(); } catch (e) { return ""; }
  var cues = payload && payload.body ? payload.body : [];
  var vtt = "WEBVTT\n\n";
  for (var i = 0; i < cues.length; i++) {
    var cue = cues[i];
    if (cue.from === undefined || cue.to === undefined || !cue.content) continue;
    vtt += timecode(cue.from) + " --> " + timecode(cue.to) + "\n";
    vtt += String(cue.content) + "\n\n";
  }
  if (vtt === "WEBVTT\n\n") return "";
  var bytes = new java.lang.String(vtt).getBytes("UTF-8");
  try { return "data:text/vtt;base64," + String(java.util.Base64.getEncoder().encodeToString(bytes)); } catch (e) {}
  try { return "data:text/vtt;base64," + String(android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)); } catch (e2) {}
  return "";
}

function getSubtitles(episodeId) {
  var result = [];
  var url = API_URL + "/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=" + episodeId +
    "&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
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
    var jsonUrl = track.srt && track.srt.url ? track.srt.url : "";
    var data = jsonUrl ? subtitleVtt(jsonUrl) : "";
    var type = "vtt";
    if (!data && track.ass && track.ass.url) {
      data = track.ass.url;
      type = "ass";
    }
    if (data) result.push({ data: data, type: type, label: track.lang || track.lang_key || "Subtitle", language: track.lang_key || "" });
  }
  return result;
}

function getAudios(playurl) {
  var result = [];
  var resources = playurl.audio_resource || [];
  for (var i = 0; i < resources.length; i++) {
    var url = resourceUrl(resources[i]);
    if (url) result.push({ data: url, type: "", label: "BiliBili AAC", language: "zh", headers: MEDIA_HEADERS });
  }
  return result;
}

function execute(data) {
  var episodeId = extractEpisodeId(data);
  if (!episodeId) return Response.error("URL tap BiliBili khong hop le");

  var url = API_URL + "/playurl?s_locale=vi_VN&platform=web&ep_id=" + episodeId +
    "&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Khong the lay luong phat BiliBili");

  var payload;
  try { payload = response.json(); } catch (e) { return Response.error("Phan hoi BiliBili khong hop le"); }
  if (!payload || payload.code !== 0 || !payload.data || !payload.data.playurl) return Response.error("BiliBili khong tra playback");

  var playurl = payload.data.playurl;
  var videos = playurl.video || [];
  var video = null;
  var videoUrl = "";
  for (var i = 0; i < videos.length; i++) {
    var candidate = resourceUrl(videos[i].video_resource);
    if (candidate) { video = videos[i].video_resource; videoUrl = candidate; break; }
  }
  if (!videoUrl) return Response.error("BiliBili khong co URL video");

  var subtitles = [];
  try { subtitles = getSubtitles(episodeId); } catch (subtitleError) { subtitles = []; }
  return Response.success({
    type: "native",
    data: videoUrl,
    mimeType: video.mime_type || "video/mp4",
    headers: { "User-Agent": MEDIA_HEADERS["User-Agent"], "Referer": absoluteUrl(data) },
    audios: getAudios(playurl),
    subtitles: subtitles,
    subtitleTracks: subtitles
  });
}
