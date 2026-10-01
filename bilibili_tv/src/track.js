load("config.js");

var VIDEO_HEADERS = {
  "User-Agent": FETCH_OPTIONS.headers["User-Agent"],
  "Accept-Language": FETCH_OPTIONS.headers["Accept-Language"]
};

function resourceUrl(resource) {
  if (!resource) return "";
  if (resource.url) return resource.url;
  if (resource.backup_url && resource.backup_url.length > 0) return resource.backup_url[0];
  return "";
}

function subtitleType(url) {
  if (/\.ass(?:\?|$)/i.test(url)) return "ass";
  if (/\.srt(?:\?|$)/i.test(url)) return "srt";
  return "vtt";
}

function subtitleUrl(track) {
  if (!track) return "";
  if (track.url) return track.url;
  if (track.subtitle_url) return track.subtitle_url;
  if (track.srt_url) return track.srt_url;
  if (track.subtitle && track.subtitle.url) return track.subtitle.url;
  return "";
}

function getSubtitles(episodeId) {
  var subtitles = [];
  var api = API_URL + "/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=" + episodeId + "&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(api, FETCH_OPTIONS);
  if (!response || !response.ok) return subtitles;

  var payload;
  try { payload = response.json(); } catch (e) { return subtitles; }
  var data = payload && payload.data ? payload.data : {};
  var tracks = data.subtitles || data.video_subtitle || data.subtitle || [];
  var ordered = [];
  var i;

  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].lang_key === "vi") ordered.push(tracks[i]);
  }
  for (i = 0; i < tracks.length; i++) {
    if (tracks[i].lang_key !== "vi") ordered.push(tracks[i]);
  }
  for (i = 0; i < ordered.length; i++) {
    var track = ordered[i];
    var url = subtitleUrl(track);
    if (!url) continue;
    subtitles.push({
      data: url,
      type: subtitleType(url),
      label: track.lang || track.language || track.lang_key || "Subtitle",
      language: track.lang_key || track.language || ""
    });
  }
  return subtitles;
}

function getAudios(playurl) {
  var audios = [];
  var resources = playurl && playurl.audio_resource ? playurl.audio_resource : [];
  for (var i = 0; i < resources.length; i++) {
    var url = resourceUrl(resources[i]);
    if (!url) continue;
    audios.push({
      data: url,
      type: "",
      label: "BiliBili AAC",
      language: "zh",
      headers: VIDEO_HEADERS
    });
  }
  return audios;
}

function execute(data) {
  var episodeId = extractEpisodeId(data);
  if (!episodeId) return Response.error("URL tập BiliBili không hợp lệ");

  var api = API_URL + "/playurl?s_locale=vi_VN&platform=web&ep_id=" + episodeId + "&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(api, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể lấy luồng phát BiliBili");

  var payload;
  try { payload = response.json(); } catch (e) { return Response.error("Phản hồi BiliBili không hợp lệ"); }
  if (!payload || payload.code !== 0 || !payload.data || !payload.data.playurl) {
    return Response.error("BiliBili không trả dữ liệu phát");
  }

  var playurl = payload.data.playurl;
  var videos = playurl.video || [];
  var video = null;
  var videoUrl = "";
  for (var i = 0; i < videos.length; i++) {
    var candidate = resourceUrl(videos[i].video_resource);
    if (!candidate) continue;
    video = videos[i].video_resource;
    videoUrl = candidate;
    break;
  }
  if (!videoUrl) return Response.error("BiliBili không trả URL video khả dụng");

  var audios = getAudios(playurl);
  var subtitles = getSubtitles(episodeId);
  return Response.success({
    type: "native",
    data: videoUrl,
    mimeType: video.mime_type || "video/mp4",
    headers: {
      "User-Agent": VIDEO_HEADERS["User-Agent"],
      "Referer": absoluteUrl(data)
    },
    audios: audios,
    subtitles: subtitles
  });
}
load("config.js");

var VIDEO_HEADERS = {
  "User-Agent": FETCH_OPTIONS.headers["User-Agent"],
  "Accept-Language": FETCH_OPTIONS.headers["Accept-Language"]
};

function resourceUrl(resource) {
  if (!resource) return "";
  if (resource.url) return resource.url;
  if (resource.backup_url && resource.backup_url.length > 0) return resource.backup_url[0];
  return "";
}

function subtitleUrl(track) {
  if (!track) return "";
  if (track.url) return track.url;
  if (track.subtitle_url) return track.subtitle_url;
  if (track.srt_url) return track.srt_url;
  if (track.subtitle && track.subtitle.url) return track.subtitle.url;
  return "";
}

function subtitleType(url) {
  if (/\.ass(?:\?|$)/i.test(url)) return "ass";
  if (/\.srt(?:\?|$)/i.test(url)) return "srt";
  return "vtt";
}

function subtitleTracks(episodeId) {
  var subtitles = [];
  var api = API_URL + "/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=" + episodeId + "&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(api, FETCH_OPTIONS);
  if (!response || !response.ok) return subtitles;
  var payload;
  try { payload = response.json(); } catch (e) { return subtitles; }
  var data = payload && payload.data ? payload.data : {};
  var tracks = data.subtitles || data.video_subtitle || data.subtitle || [];
  var ordered = [];
  for (var i = 0; i < tracks.length; i++) {
    if (tracks[i].lang_key === "vi") ordered.push(tracks[i]);
  }
  for (var j = 0; j < tracks.length; j++) {
    if (tracks[j].lang_key !== "vi") ordered.push(tracks[j]);
  }
  for (var k = 0; k < ordered.length; k++) {
    var track = ordered[k];
    var url = subtitleUrl(track);
    if (!url) continue;
    subtitles.push({
      data: url,
      type: subtitleType(url),
      label: track.lang || track.language || track.lang_key || "Subtitle",
      language: track.lang_key || track.language || ""
    });
  }
  return subtitles;
}

function execute(data) {
  var episodeId = extractEpisodeId(data);
  if (!episodeId) return Response.error("URL tập BiliBili không hợp lệ");
  var api = API_URL + "/playurl?s_locale=vi_VN&platform=web&ep_id=" + episodeId + "&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=";
  var response = fetch(api, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể lấy luồng phát BiliBili");
  var payload;
  try { payload = response.json(); } catch (e) { return Response.error("Phản hồi BiliBili không hợp lệ"); }
  if (!payload || payload.code !== 0 || !payload.data || !payload.data.playurl) return Response.error("BiliBili không trả dữ liệu phát");
  var videos = payload.data.playurl.video || [];
  var video = null;
  var videoUrl = "";
  for (var i = 0; i < videos.length; i++) {
    var candidate = resourceUrl(videos[i].video_resource);
    if (!candidate) continue;
    video = videos[i].video_resource;
    videoUrl = candidate;
    break;
  }
  if (!videoUrl) return Response.error("BiliBili không trả URL video khả dụng");
  return Response.success({
    type: "native",
    data: videoUrl,
    mimeType: video.mime_type || "video/mp4",
    headers: {
      "User-Agent": VIDEO_HEADERS["User-Agent"],
      "Referer": absoluteUrl(data)
    },
    subtitles: subtitleTracks(episodeId)
  });
}