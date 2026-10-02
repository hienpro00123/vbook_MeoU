load("config.js");

function execute(query, page) {
  var currentPage = parseInt(page || "1", 10);
  if (!currentPage || currentPage < 1) currentPage = 1;
  var url = API_URL + "/v2/ogv/index/items_v2?s_locale=vi_VN&platform=web&season_type=1,4&pn=" + currentPage + "&ps=20&order=0";
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Khong tai duoc anime BiliBili");
  var payload;
  try { payload = response.json(); } catch (e) { return Response.error("Du lieu anime BiliBili khong hop le"); }
  var cards = payload && payload.data && payload.data.cards ? payload.data.cards : [];
  var items = [];
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (!card || !card.season_id || !card.title) continue;
    items.push({
      name: card.title,
      link: BASE_URL + "/vi/play/" + card.season_id,
      host: BASE_URL,
      cover: card.cover || "",
      description: card.index_show || ""
    });
  }
  var next = payload.data && payload.data.has_next ? String(currentPage + 1) : "";
  return Response.success(items, next);
}
