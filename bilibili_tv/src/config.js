var BASE_URL = "https://www.bilibili.tv";
var API_URL = "https://api.bilibili.tv/intl/gateway/web";
var FETCH_OPTIONS = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
  }
};

function fetchDocument(url) {
  var res = fetch(url, FETCH_OPTIONS);
  if (!res || !res.ok) return null;
  try { return res.html(); } catch (e) { return null; }
}

function absoluteUrl(url) {
  if (!url) return "";
  if (url.indexOf("//") === 0) return "https:" + url;
  if (url.indexOf("http") === 0) return url;
  if (url.indexOf("/play/") === 0 || url.indexOf("/media/") === 0) return BASE_URL + "/vi" + url;
  return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function elementAttr(element, name) {
  return element ? element.attr(name) : "";
}

function imageSource(image) {
  if (!image) return "";
  var source = elementAttr(image, "src") || elementAttr(image, "data-src") || elementAttr(image, "data-original");
  if (source) return source;
  var srcset = elementAttr(image, "srcset");
  if (srcset) return srcset.split(",")[0].trim().split(" ")[0];
  return "";
}

function imageCards(doc) {
  return doc.select("a.card-image, a.video-card__cover, a.bstar-video-card__cover, a[class*='video-card__cover'], .ogv__cover a[href]");
}

function firstImage(doc, href) {
  var cards = imageCards(doc);
  var target = absoluteUrl(href).split("?")[0];
  for (var i = 0; i < cards.size(); i++) {
    var card = cards.get(i);
    var cardUrl = absoluteUrl(elementAttr(card, "href")).split("?")[0];
    if (cardUrl !== target) continue;
    var images = card.select("img, source");
    if (images.size() > 0) {
      var source = imageSource(images.get(0));
      if (source) return absoluteUrl(source);
    }
  }
  return "";
}

function imageAt(doc, index) {
  var cards = imageCards(doc);
  if (index < 0 || index >= cards.size()) return "";
  var images = cards.get(index).select("img, source");
  if (images.size() === 0) return "";
  var source = imageSource(images.get(0));
  return source ? absoluteUrl(source) : "";
}

function parseVideoCards(doc) {
  var items = [];
  var seen = {};
  var titles = doc.select("a.card-title, a.bstar-video-card__title-text, a.ogv__content-title");
  for (var i = 0; i < titles.size(); i++) {
    var title = titles.get(i);
    var href = elementAttr(title, "href");
    var name = title.text().trim();
    if (!href || !name) continue;
    var link = absoluteUrl(href);
    if (seen[link]) continue;
    seen[link] = true;
    items.push({
      name: name,
      link: link,
      host: BASE_URL,
      cover: firstImage(doc, href) || imageAt(doc, i),
      description: ""
    });
  }
  return items;
}

function extractEpisodeId(url) {
  var match = /\/vi\/(?:play|media)\/\d+\/(\d+)/.exec(url || "");
  return match ? match[1] : null;
}

function extractSeasonId(url) {
  var match = /\/vi\/(?:play|media)\/(\d+)/.exec(url || "");
  return match ? match[1] : null;
}
