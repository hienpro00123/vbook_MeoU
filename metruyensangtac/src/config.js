var BASE_URL = "https://metruyensangtac.com";
var HOST = BASE_URL;

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

var SLUG_RE = /\/truyen\/([^\/?#]+)/;
var ID_TRUYEN_RE = /var\s+DECU_ID_TRUYEN\s*=\s*(\d+)/;

function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function fetchRetry(url, options) {
    var opt = options || FETCH_OPTIONS;
    var res = fetch(url, opt);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, opt);
    }
    return res;
}

function extractSlug(url) {
    var m = SLUG_RE.exec(url);
    return m ? m[1] : "";
}

function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<br\s*\/?>/gi, "\n")
               .replace(/<\/p>/gi, "\n")
               .replace(/<[^>]+>/g, "")
               .replace(/&amp;/g, "&")
               .replace(/&lt;/g, "<")
               .replace(/&gt;/g, ">")
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/\n{3,}/g, "\n\n")
               .trim();
}
