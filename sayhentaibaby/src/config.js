var BASE_URL = "https://sayhentai.baby";
var HOST = BASE_URL;

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

function selFirst(el, css) {
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, FETCH_OPTIONS);
    }
    return res;
}

// Parse danh sách truyện từ article.thumb cards
function parseList(doc) {
    var result = [];
    var cards = doc.select("article.thumb");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var linkEl = selFirst(card, "a.halim-thumb[href]");
        if (!linkEl) linkEl = selFirst(card, "a[href*='/truyen/']");
        if (!linkEl) continue;
        var href = linkEl.attr("href");
        if (!href || href.indexOf("/truyen/") < 0) continue;
        var name = linkEl.attr("title");
        if (!name) {
            var titleEl = selFirst(card, "h2.entry-title, .halim-post-title-box h2");
            name = titleEl ? titleEl.text().trim() : "";
        }
        if (!name) continue;
        var imgEl = selFirst(card, "img.lazyload, img[data-src], img");
        var cover = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src") || "") : "";
        var chapEl = selFirst(card, "span.episode");
        var description = chapEl ? chapEl.text().trim() : "";
        result.push({
            name: name,
            link: href.indexOf("http") === 0 ? href : resolveUrl(href),
            cover: cover.indexOf("http") === 0 ? cover : resolveUrl(cover),
            description: description
        });
    }
    return result;
}
