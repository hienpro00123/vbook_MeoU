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
