load("config.js");

function queryValue(url, key) {
  var pattern = new RegExp("[?&]" + key + "=([^&]*)");
  var match = pattern.exec(url || "");
  if (!match) return "";
  return decodeURIComponent(match[1].replace(/\+/g, " "));
}

function categoryItems(path, page) {
  var seasonType = queryValue(path, "season_type") || "1,4";
  var styleId = queryValue(path, "style_id");
  var url = API_URL + "/v2/ogv/index/items_v2?s_locale=vi_VN&platform=web"
    + "&season_type=" + encodeURIComponent(seasonType)
    + "&pn=" + page + "&ps=20&order=0";
  if (styleId) url += "&style_id=" + encodeURIComponent(styleId);

  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return null;
  try {
    var payload = response.json();
    if (!payload || payload.code !== 0 || !payload.data) return null;
    var cards = payload.data.cards || [];
    var items = [];
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (!card.season_id || !card.title) continue;
      items.push({
        name: card.title,
        link: BASE_URL + "/vi/play/" + card.season_id,
        host: BASE_URL,
        cover: card.cover || "",
        description: card.index_show || card.view || ""
      });
    }
    var next = payload.data.has_next ? String(parseInt(page, 10) + 1) : "";
    return { items: items, next: next };
  } catch (e) {
    return null;
  }
}

function execute(path, page) {
  var url = path || "/vi/anime";
  var pageNumber = page || "1";
  if (url.indexOf("/vi/category") === 0 || url.indexOf("/vi/anime") === 0) {
    var category = categoryItems(url, pageNumber);
    if (category) return Response.success(category.items, category.next);
  }

  var doc = fetchDocument(absoluteUrl(url));
  if (!doc) return Response.error("Không thể tải danh sách BiliBili");
  return Response.success(parseVideoCards(doc), "");
}
