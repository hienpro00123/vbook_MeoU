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
      audios: audioTracks
    });
  } catch (e) {
    return Response.error("Không thể phân tích luồng phát BiliBili");
  }
}
