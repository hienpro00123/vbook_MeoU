var BASE_URL = "https://lnkuro.top";
var HOST = "https://lnkuro.top";
var BROWSER_TIMEOUT = 8000;
var LAST_LOAD_ERROR = "";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
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

function setLoadError(message) {
    LAST_LOAD_ERROR = message || "";
    return null;
}

function getLoadError(defaultMessage) {
    return LAST_LOAD_ERROR || defaultMessage || "Không tải được dữ liệu";
}

function isCloudflareBlockedDoc(doc) {
    if (!doc) return false;

    var titleEl = selFirst(doc, "title");
    var title = titleEl ? titleEl.text().toLowerCase() : "";
    if (title.indexOf("attention required") !== -1) return true;

    var bodyText = "";
    try { bodyText = (doc.text() || "").toLowerCase(); } catch (e) { bodyText = ""; }

    return bodyText.indexOf("sorry, you have been blocked") !== -1
        || bodyText.indexOf("you are unable to access") !== -1
        || bodyText.indexOf("cloudflare ray id") !== -1;
}

function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, FETCH_OPTIONS);
    }
    return res;
}

function loadDoc(pageUrl) {
    LAST_LOAD_ERROR = "";
    var blockedMessage = "";

    var res = fetchRetry(pageUrl);
    if (res && res.ok) {
        var doc = res.html();
        if (doc && !isCloudflareBlockedDoc(doc)) return doc;
        if (doc && isCloudflareBlockedDoc(doc)) {
            blockedMessage = "Site chặn truy cập bởi Cloudflare: " + pageUrl;
        }
    }

    if (res && (res.status === 403 || res.status === 429)) {
        blockedMessage = "Site chặn truy cập (HTTP " + res.status + "): " + pageUrl;
    }

    var browser = Engine.newBrowser();
    try {
        var browserDoc = browser.launch(pageUrl, BROWSER_TIMEOUT);
        if (browserDoc && !isCloudflareBlockedDoc(browserDoc)) return browserDoc;
        if (browserDoc && isCloudflareBlockedDoc(browserDoc)) {
            blockedMessage = "Site chặn truy cập bởi Cloudflare: " + pageUrl;
        }
    } catch (e) {
        if (!blockedMessage) blockedMessage = "Không tải được trang: " + pageUrl;
    } finally {
        try { browser.close(); } catch (e2) {}
    }

    return setLoadError(blockedMessage || "Không tải được trang: " + pageUrl);
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
    var doc = loadDoc(BASE_URL + "/truyen-han-quoc/");
    if (!doc) return "";
    var el = selFirst(doc, "input[name=kr_nonce]");
    _cachedNonce = el ? el.attr("value") : "";
    return _cachedNonce;
}

function searchAjax(keyword, page) {
    LAST_LOAD_ERROR = "";
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
        if (!res || !res.ok) {
            setLoadError("Không tải được tìm kiếm: " + BASE_URL + "/wp-admin/admin-ajax.php");
            return null;
        }
    }
    try { return res.json(); } catch(e) {
        setLoadError("Dữ liệu tìm kiếm không hợp lệ");
        return null;
    }
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
