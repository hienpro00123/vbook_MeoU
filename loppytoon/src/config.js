var BASE_URL = "https://loppytoon.com";
var HOST = "https://loppytoon.com";
var STORAGE_URL = "https://storage.loppytoon.com";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

var SLUG_RE = /\/truyen\/([^\/?#]+)/;

function selFirst(el, css) {
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function extractSlug(href) {
    var m = SLUG_RE.exec(href || "");
    return m ? m[1] : "";
}

function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, FETCH_OPTIONS);
    }
    return res;
}

function resolveCover(src) {
    if (!src) return "";
    if (src.indexOf("http") === 0) return src;
    if (src.charAt(0) === "/") return BASE_URL + src;
    return BASE_URL + "/storage/" + src;
}

function isAdult(name) {
    var v = (name || "");
    return v.indexOf("[18+]") >= 0 || v.indexOf("(18+)") >= 0
        || v.indexOf("[19+]") >= 0 || v.indexOf("(19+)") >= 0
        || v.indexOf("\u301A18+\u301B") >= 0 || v.indexOf("\u301A19+\u301B") >= 0
        || v.indexOf("\u301618+\u3017") >= 0 || v.indexOf("\u301619+\u3017") >= 0;
}

function adultName(name) {
    var v = (name || "").trim();
    if (!v) return "";
    if (!isAdult(v)) return v;
    v = v.replace(/\[18\+\]/g, "").replace(/\(18\+\)/g, "")
         .replace(/\[19\+\]/g, "").replace(/\(19\+\)/g, "")
         .replace(/\u301A18\+\u301B/g, "").replace(/\u301A19\+\u301B/g, "")
         .replace(/\u301618\+\u3017/g, "").replace(/\u301619\+\u3017/g, "")
         .replace(/\s+/g, " ").trim();
    return "18+ " + v;
}

function parseCards(doc) {
    var items = [];
    var cards = doc.select(".comic-item");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var a = selFirst(card, "a[href*='/truyen/']");
        if (!a) continue;
        var href = a.attr("href") || "";
        var slug = extractSlug(href);
        if (!slug) continue;

        var img = selFirst(card, "img");
        var cover = img ? resolveCover(img.attr("src") || "") : "";

        var titleEl = selFirst(card, "h3");
        var name = titleEl ? titleEl.text().trim() : (img ? img.attr("alt").trim() : "");
        if (!name) continue;

        items.push({
            name: adultName(name),
            cover: isAdult(name) ? "" : cover,
            link: BASE_URL + "/truyen/" + slug,
            host: HOST
        });
    }
    return items;
}

function getNextPage(doc, currentPage) {
    var nextPage = String(currentPage + 1);
    var pageLinks = doc.select(".pagination .pagination-number a[href]");
    for (var j = 0; j < pageLinks.size(); j++) {
        var ph = pageLinks.get(j).attr("href") || "";
        if (ph.indexOf("page=" + nextPage) >= 0) return nextPage;
    }
    return null;
}
