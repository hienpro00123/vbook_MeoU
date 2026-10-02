load("config.js");

function execute(keyword, page) {
  keyword = keyword || "";
  var currentPage = parseInt(page || "1", 10);
  if (!keyword) return Response.success([], "");
  if (!currentPage || currentPage < 1) currentPage = 1;
  var url = API_URL + "/v2/search_v2/anime?s_locale=vi_VN&platform=web&keyword=" + encodeURIComponent(keyword) + "&highlight=1&pn=" + currentPage + "&ps=20&sort=0&duration_type=0";
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Khong tim duoc anime BiliBili");
  var payload;
  try { payload = response.json(); } catch (e) { return Response.error("Ket qua tim kiem khong hop le"); }
  var results = payload && payload.data && payload.data.items ? payload.data.items : [];
  var items = [];
  for (var i = 0; i < results.length; i++) {
    var item = results[i];
    if (!item || !item.season_id || !item.title) continue;
    items.push({
      name: item.title,
      link: BASE_URL + "/vi/play/" + item.season_id,
      host: BASE_URL,
      cover: item.cover || "",
      description: item.index_show || item.description || ""
    });
  }
  var next = payload.data && payload.data.has_next ? String(currentPage + 1) : "";
  return Response.success(items, next);
}
