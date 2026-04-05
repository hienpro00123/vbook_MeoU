var BASE_URL = "https://truyenchu.net";
var HOST = "https://truyenchu.net";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": "https://truyenchu.net/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

var BG_IMAGE_RE = /url\(['""]?([^'""\)\s]+)['""]?\)/;
var HREF_SKIP_RE = /^\s*$|^javascript:|^#|\/wp-login|\/wp-admin|\/cart|\/checkout|\/account|\/contact|\/tag\//;

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
    if (!res.ok && !(res.status >= 400 && res.status < 500)) res = fetch(url, FETCH_OPTIONS);
    return res;
}

// Trích xuất cover từ element (Madara dùng data-src lazy loading)
function extractCover(el) {
    var imgEl = selFirst(el, "img[data-src], img[data-lazy], img[src]");
    if (imgEl) {
        var src = imgEl.attr("data-src") || imgEl.attr("data-lazy") || imgEl.attr("src") || "";
        if (src && src.indexOf("data:") !== 0) return src;
    }
    var bgEl = selFirst(el, "[data-bg], [style*='background-image']");
    if (bgEl) {
        var bg = bgEl.attr("data-bg") || "";
        if (!bg) {
            var m = BG_IMAGE_RE.exec(bgEl.attr("style") || "");
            if (m) bg = m[1];
        }
        if (bg) return bg;
    }
    return "";
}

// Parse danh sách truyện từ Madara WP-Manga theme (trang list / thể loại / tìm kiếm)
function parseList(doc) {
    var result = [];
    var seen = {};

    var cards = doc.select(".page-item-detail");
    if (cards.size() === 0) cards = doc.select(".manga__item, .c-image-hover, .row.row-eq-height .col-6");

    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);

        var titleA = selFirst(card, ".post-title a[href], h3.h5 a[href], h3 a[href], h2 a[href]");
        if (!titleA) continue;

        var href = titleA.attr("href") || "";
        if (!href || HREF_SKIP_RE.test(href)) continue;
        if (href.indexOf("/the-loai/") !== -1 || href.indexOf("/tac-gia/") !== -1) continue;

        // Chuẩn hoá về relative path
        var link = href.indexOf(BASE_URL) === 0 ? href.substring(BASE_URL.length) : href;
        if (seen[link]) continue;
        seen[link] = true;

        var name = titleA.text().trim();
        if (!name) continue;

        var cover = extractCover(card);
        if (cover && cover.indexOf("http") !== 0) cover = BASE_URL + cover;

        result.push({ name: name, link: link, host: HOST, cover: cover, description: "" });
    }
    return result;
}

// Lấy số trang tiếp theo từ WordPress /page/N/ pagination
function getNextPage(doc, p) {
    var nextP = p + 1;
    // Tìm link chứa /page/{nextP}/
    var nextLinks = doc.select("a[href*='/page/" + nextP + "/']");
    if (nextLinks.size() > 0) return String(nextP);
    // Kiểm tra nút "Cũ hơn" / "Older posts"
    var olderLink = selFirst(doc, ".nav-previous a, a[rel='prev'], a:contains(Cũ hơn), a:contains(Older)");
    if (olderLink) {
        var href = olderLink.attr("href") || "";
        var m = /\/page\/(\d+)\/?/.exec(href);
        if (m) return m[1];
        if (href) return String(nextP);
    }
    return null;
}
