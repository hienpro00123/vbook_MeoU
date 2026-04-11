var BASE_URL = "https://lnkuro.top";
var HOST = "https://lnkuro.top";

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
        if (src && src.indexOf("data:") !== 0) {
            if (src.charAt(0) === 47) src = BASE_URL + src;
            return src;
        }
    }
    return "";
}

var _cachedNonce = "";

function getNonce() {
    if (_cachedNonce) return _cachedNonce;
    var res = fetchRetry(BASE_URL + "/truyen-han-quoc/");
    if (!res || !res.ok) return "";
    var doc = res.html();
    if (!doc) return "";
    var el = selFirst(doc, "input[name=kr_nonce]");
    _cachedNonce = el ? el.attr("value") : "";
    return _cachedNonce;
}

function searchAjax(keyword, page) {
    var nonce = getNonce();
    if (!nonce) return null;
    var q = java.net.URLEncoder.encode(keyword, "UTF-8");
    var p = page || 1;
    var body = "action=kr_search_truyen&q=" + q + "&kr_nonce=" + nonce + "&page=" + p;
    var res = fetch(BASE_URL + "/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Referer": BASE_URL + "/truyen-han-quoc/"
        },
        body: body
    });
    if (!res || !res.ok) {
        // Nonce expired — refresh and retry once
        _cachedNonce = "";
        nonce = getNonce();
        if (!nonce) return null;
        body = "action=kr_search_truyen&q=" + q + "&kr_nonce=" + nonce + "&page=" + p;
        res = fetch(BASE_URL + "/wp-admin/admin-ajax.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": FETCH_HEADERS["User-Agent"],
                "Referer": BASE_URL + "/truyen-han-quoc/"
            },
            body: body
        });
        if (!res || !res.ok) return null;
    }
    try { return res.json(); } catch(e) { return null; }
}

function parseCards(doc) {
    var result = [];
    var seen = {};

    var cards = doc.select("article.kr-card");

    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var titleA = selFirst(card, ".kr-card__title a[href]");
        if (!titleA) continue;

        var href = titleA.attr("href") || "";
        if (!href || href.indexOf("/the-loai/") !== -1) continue;

        var title = titleA.text().trim();
        if (!title || seen[href]) continue;
        seen[href] = true;

        var cover = extractCover(card);

        result.push({
            name: title,
            link: href,
            host: HOST,
            cover: cover
        });
    }

    return result;
}
