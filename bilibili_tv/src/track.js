load("config.js");

var VIDEO_HEADERS = {
  "User-Agent": FETCH_OPTIONS.headers["User-Agent"],
  "Accept-Language": FETCH_OPTIONS.headers["Accept-Language"]
};

function resourceUrl(resource) {
  if (!resource) return "";
  if (resource.url) return resource.url;
  var backups = resource.backup_url;
  if (backups && backups.length > 0) return backups[0];
  return "";
}

function subtitleTimestamp(seconds) {
  var milliseconds = Math.round(parseFloat(seconds) * 1000);
  var hours = Math.floor(milliseconds / 3600000);
  var minutes = Math.floor((milliseconds % 3600000) / 60000);
  var remainder = milliseconds % 60000;
  var wholeSeconds = Math.floor(remainder / 1000);
  var fraction = remainder % 1000;
  return padTime(hours) + ":" + padTime(minutes) + ":" + padTime(wholeSeconds) + "." + padMilliseconds(fraction);
}

function padTime(value) {
  return value < 10 ? "0" + value : String(value);
}

function padMilliseconds(value) {
  if (value < 10) return "00" + value;
  if (value < 100) return "0" + value;
  return String(value);
}

function subtitleDataUri(subtitleUrl) {
  var response = fetch(subtitleUrl, FETCH_OPTIONS);
  if (!response || !response.ok) return "";
  var payload = response.json();
  var cues = payload && payload.body ? payload.body : [];
  if (!cues.length) return "";

  var vtt = "WEBVTT\n\n";
  for (var i = 0; i < cues.length; i++) {
    var cue = cues[i];
    if (cue.from === undefined || cue.to === undefined || !cue.content) continue;
    vtt += subtitleTimestamp(cue.from) + " --> " + subtitleTimestamp(cue.to) + "\n";
    vtt += String(cue.content).replace(/\r?\n/g, "\n") + "\n\n";
  }
  if (vtt === "WEBVTT\n\n") return "";

  var bytes = new java.lang.String(vtt).getBytes("UTF-8");
  var encoded = String(java.util.Base64.getEncoder().encodeToString(bytes));
  return "data:text/vtt;base64," + encoded;
}

function subtitleTracks(episodeId) {
  var subtitles = [];
  var api = API_URL + "/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=" + episodeId + "&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(api, FETCH_OPTIONS);
  if (!response || !response.ok) return subtitles;

  try {
    var payload = response.json();
    var tracks = payload && payload.data ? payload.data.video_subtitle : [];
    var orderedTracks = [];
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].lang_key === "vi") orderedTracks.push(tracks[i]);
    }
    for (var j = 0; j < tracks.length; j++) {
      if (tracks[j].lang_key !== "vi") orderedTracks.push(tracks[j]);
    }
    for (var k = 0; k < orderedTracks.length; k++) {
      var track = orderedTracks[k];
      if (!track.srt || !track.srt.url) continue;
      try {
        var subtitleData = subtitleDataUri(track.srt.url);
        if (!subtitleData) continue;
        subtitles.push({
          data: subtitleData,
          type: "vtt",
          label: track.lang,
          language: track.lang_key
        });
      } catch (subtitleError) {}
    }
  } catch (e) {}
  return subtitles;
}

function execute(data) {
  var episodeId = extractEpisodeId(data);
  if (!episodeId) return Response.error("URL tập BiliBili không hợp lệ");

  var api = API_URL + "/playurl?s_locale=vi_VN&platform=web&ep_id=" + episodeId + "&tk=&qn=32&type=0&device=wap&tf=0";
  var response = fetch(api, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể lấy luồng phát BiliBili");

  try {
    var payload = response.json();
    var playurl = payload && payload.data ? payload.data.playurl : null;
    var videos = playurl && playurl.video ? playurl.video : [];
    var video = null;
    var videoUrl = "";
    for (var i = 0; i < videos.length; i++) {
      var candidate = resourceUrl(videos[i].video_resource);
      if (candidate) {
        video = videos[i].video_resource;
        videoUrl = candidate;
        break;
      }
    }
    if (!videoUrl) return Response.error("BiliBili không trả URL video khả dụng");

    var audioResources = playurl.audio_resource || [];
    var audioTracks = [];
    for (var j = 0; j < audioResources.length; j++) {
      var audioUrl = resourceUrl(audioResources[j]);
      if (audioUrl) {
        audioTracks.push({
          data: audioUrl,
          label: "BiliBili AAC",
          language: "zh",
          headers: VIDEO_HEADERS
        });
        break;
      }
    }

    return Response.success({
      type: "native",
      data: videoUrl,
      mimeType: video.mime_type || "video/mp4",
      headers: {
        "User-Agent": VIDEO_HEADERS["User-Agent"],
        Referer: absoluteUrl(data)
      },
      audios: audioTracks,
      subtitles: subtitleTracks(episodeId)
    });
  } catch (e) {
    return Response.error("Không thể phân tích luồng phát BiliBili");
  }
}
