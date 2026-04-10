var BASE_URL = "https://lnkuro.top";
var HOST = "lnkuro.top";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
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

function extractCover(el) {
    var imgEl = selFirst(el, "img[data-src], img[data-lazy-src], img[src]");
    if (imgEl) {
        var src = imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || imgEl.attr("src") || "";
        if (src && src.indexOf("data:") !== 0) return src;
    }
    return "";
}

function parseCards(doc) {
    var result = [];
    var seen = {};

    var cards = doc.select(".page-item-detail");
    if (cards.size() === 0) cards = doc.select(".manga, article.wp-manga");

    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var titleA = selFirst(card, ".post-title a[href], h3 a[href], h2 a[href]");
        if (!titleA) continue;

        var href = titleA.attr("href") || "";
        if (!href || href.indexOf("/the-loai/") !== -1 || href.indexOf("/tag-truyen/") !== -1) continue;

        var title = titleA.text().trim();
        if (!title || seen[href]) continue;
        seen[href] = true;

        var cover = extractCover(card);

        result.push({
            name: title,
            link: href,
            cover: cover
        });
    }

    // Fallback: parse links directly
    if (result.length === 0) {
        var links = doc.select("a[href*='lnkuro.top/']");
        for (var j = 0; j < links.size(); j++) {
            var a = links.get(j);
            var h = a.attr("href") || "";
            if (!h || seen[h]) continue;
            if (h.indexOf("/the-loai/") !== -1 || h.indexOf("/tag-truyen/") !== -1) continue;
            if (h.indexOf("/convert/") !== -1 || h.indexOf("/page/") !== -1) continue;
            if (h.indexOf("-chuong-") !== -1 || h.indexOf("/?") !== -1) continue;
            if (h === BASE_URL || h === BASE_URL + "/") continue;

            var t = a.text().trim();
            if (!t || t.length < 3 || t.indexOf("Đọc ngay") !== -1) continue;
            if (t.indexOf("Xem tất cả") !== -1 || t.indexOf("Menu") !== -1) continue;
            if (seen[h]) continue;
            seen[h] = true;

            var cov = "";

            result.push({
                name: t,
                link: h,
                cover: cov
            });
        }
    }

    return result;
}
