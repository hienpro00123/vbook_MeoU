load("config.js");

function execute(url) {
  var episodeId = extractEpisodeId(url);
  if (!episodeId) return Response.error("URL tập BiliBili không hợp lệ");

  var api = API_URL + "/playurl?s_locale=vi_VN&platform=web&ep_id=" + episodeId + "&tk=&qn=32&type=0&device=wap&tf=0";
  var res = fetch(api, FETCH_OPTIONS);
  if (res && res.ok) {
    try {
      var data = res.json();
      var tracks = data.data && data.data.playurl ? data.data.playurl.video : null;
      if (tracks && tracks.length > 0) {
        for (var i = 0; i < tracks.length; i++) {
          var resource = tracks[i].video_resource;
          if (resource && resource.url) return Response.success([{ link: resource.url }]);
        }
      }
    } catch (e) {}
  }
  return Response.success([{ link: absoluteUrl(url) }]);
}
