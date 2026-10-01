load("config.js");
function execute(path, page) {
  var url = API_URL + "/v2/ogv/index/items_v2?s_locale=vi_VN&platform=web&season_type=1,4&pn=" + (page || "1") + "&ps=20&order=0";
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Không thể tải danh sách BiliBili");
  var payload = response.json();
  var cards = payload && payload.data ? payload.data.cards || [] : [];
  var items = [];
  for (var i = 0; i < cards.length; i++) if (cards[i].season_id && cards[i].title) items.push({ name: cards[i].title, link: BASE_URL + "/vi/play/" + cards[i].season_id, host: BASE_URL, cover: cards[i].cover || "", description: cards[i].index_show || "" });
  return Response.success(items, payload.data && payload.data.has_next ? String(parseInt(page || "1", 10) + 1) : "");
}
