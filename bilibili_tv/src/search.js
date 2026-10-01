load("config.js");
function execute(key, page) {
  if (!key) return Response.success([], "");
  var p = parseInt(page || "1", 10);
  var response = fetch(API_URL + "/v2/search_v2/anime?s_locale=vi_VN&platform=web&keyword=" + encodeURIComponent(key) + "&highlight=1&pn=" + p + "&ps=20&sort=0&duration_type=0", FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể tìm kiếm BiliBili");
  var payload = response.json(), source = payload && payload.data ? payload.data.items || [] : [], items = [];
  for (var i = 0; i < source.length; i++) if (source[i].season_id && source[i].title) items.push({ name: source[i].title, link: BASE_URL + "/vi/play/" + source[i].season_id, host: BASE_URL, cover: source[i].cover || "", description: source[i].description || "" });
  return Response.success(items, payload.data && payload.data.has_next ? String(p + 1) : "");
}
