var BASE_URL = "https://hentaicube.xyz";
var HOST = "https://hentaicube.xyz";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

var GENRE_SLUG_RE = /\/theloai\/([^\/?#]+)/;
var SIZE_SUFFIX_RE = /-\d+x\d+(\.[^./?]+)$/;

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

// Lấy ảnh chất lượng đầy đủ bằng cách bỏ hậu tố kích thước -NxN
function stripSizeSuffix(src) {
    if (!src) return "";
    return src.replace(SIZE_SUFFIX_RE, "$1");
}

// Parse danh sách truyện từ trang list/genre
// Trả về description là chương mới nhất
function parseListItems(doc) {
    var result = [];
    var seen = {};
    var cards = doc.select("div.page-item-detail");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var titleA = selFirst(card, ".post-title h3 a, h3.h5 a");
        if (!titleA) continue;
        var name = titleA.text().trim();
        var link = titleA.attr("href") || "";
        if (!link || seen[link]) continue;
        seen[link] = true;

        var imgEl = selFirst(card, ".item-thumb img");
        var cover = imgEl ? stripSizeSuffix(imgEl.attr("src") || "") : "";

        // Chương mới nhất hiển thị dưới mỗi truyện
        var chapA = selFirst(card, ".list-chapter .chapter-item .chapter a");
        var description = chapA ? chapA.text().replace(/\s+/g, " ").trim() : "";

        result.push({ name: name, link: link, host: HOST, cover: cover, description: description });
    }
    return result;
}
