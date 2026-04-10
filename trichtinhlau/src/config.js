var BASE_URL = "https://trichtinhlau.com";
var HOST = "https://trichtinhlau.com";
var IMG_BASE = "https://trichtinhlau.com/uploads/truyen/";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

function resolveUrl(url) {
    return (url.indexOf("http") === 0 ? url : BASE_URL + url).replace(/\/$/, "");
}

function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) res = fetch(url, FETCH_OPTIONS);
    return res;
}

function fetchBrowser(url, timeout) {
    var t = timeout || 15000;
    var browser = Engine.newBrowser();
    try {
        return browser.launch(url, t);
    } finally {
        browser.close();
    }
}

function parseCards(doc) {
    var result = [];
    var seen = {};
    var cards = doc.select("article.item");

    if (cards.size() > 0) {
        for (var i = 0; i < cards.size(); i++) {
            var card = cards.get(i);
            var a = selFirst(card, "a[href*='/xem-truyen/']");
            if (!a) continue;
            var href = a.attr("href");
            if (!href || seen[href]) continue;
            seen[href] = true;
            var titleEl = selFirst(card, "h5.card-title, .story-name, .story-card-name");
            var name = titleEl ? titleEl.text().trim() : a.attr("title") || "";
            if (!name) name = a.attr("title") || "";
            if (!name) continue;
            var imgEl = selFirst(card, "img");
            var cover = "";
            if (imgEl) {
                cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
            }
            if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
            var link = href.indexOf("http") === 0 ? href.replace(BASE_URL, "") : href;
            result.push({ name: name, link: link, host: HOST, cover: cover, description: "" });
        }
        return result;
    }

    // Fallback: scrape direct links (for pages using different layout)
    var links = doc.select("a[href*='/xem-truyen/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        if (!href || seen[href]) continue;
        var name = a.attr("title") || a.text().trim();
        if (!name || name.length < 2) continue;
        // Skip nav/button links (short/generic text)
        if (name === "xem truyện" || name === "Xem truyện") continue;
        seen[href] = true;
        var imgEl = selFirst(a, "img");
        var cover = "";
        if (imgEl) {
            cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
        }
        if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
        var link = href.indexOf("http") === 0 ? href.replace(BASE_URL, "") : href;
        result.push({ name: name, link: link, host: HOST, cover: cover, description: "" });
    }
    return result;
}

function getNextPage(doc, current) {
    var next = selFirst(doc, "a[href*='page=" + (current + 1) + "']");
    if (next) return String(current + 1);
    var pager = selFirst(doc, ".pagination");
    if (!pager) return null;
    var links = pager.select("a");
    var maxNum = 0;
    for (var i = 0; i < links.size(); i++) {
        var t = parseInt(links.get(i).text().trim(), 10);
        if (!isNaN(t) && t > maxNum) maxNum = t;
    }
    if (maxNum > current) return String(current + 1);
    return null;
}
