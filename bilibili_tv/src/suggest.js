load("config.js");

function execute(url) {
  var doc = fetchDocument(url);
  if (!doc) return Response.error("Không thể tải đề xuất BiliBili");

  var cards = doc.select(".recommends__list .recommends__card");
  var items = [];
  var seen = {};
  for (var i = 0; i < cards.size(); i++) {
    var card = cards.get(i);
    var links = card.select("a.bstar-video-card__title-text[href*='/play/']");
    if (links.size() === 0) continue;
    var linkElement = links.get(0);
    var href = elementAttr(linkElement, "href");
    var name = linkElement.text().trim();
    var link = absoluteUrl(href);
    if (!name || !link || seen[link]) continue;
    seen[link] = true;

    var images = card.select("img.bstar-image__img, .bstar-video-card__cover img");
    var cover = images.size() > 0 ? absoluteUrl(imageSource(images.get(0))) : "";
    var descriptions = card.select(".bstar-video-card__desc");
    var description = descriptions.size() > 0 ? descriptions.get(0).text().trim() : "";
    items.push({
      name: name,
      link: link,
      host: BASE_URL,
      cover: cover,
      description: description
    });
  }
  return Response.success(items);
}
