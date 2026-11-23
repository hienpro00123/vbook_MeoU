var BASE_URL = typeof DOMAIN !== "undefined" && DOMAIN ? DOMAIN : "https://muahecove.com";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};

function fetchPage(url) {
    var res = fetch(url, { headers: FETCH_HEADERS });
    if (!res) return null;
    // Retry once on 5xx
    if (!res.ok && res.status >= 500) {
        res = fetch(url, { headers: FETCH_HEADERS });
    }
    return res;
}
