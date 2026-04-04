const BASE_URL = "https://metruyenchu.com.vn";
const HOST = "https://metruyenchu.com.vn";

// Cache headers — khởi tạo 1 lần, tái dùng mãi
var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS }; // cache cả object options

// Chuẩn hóa URL: thêm BASE_URL nếu cần, bỏ trailing slash
function resolveUrl(url) {
    return (url.indexOf("http") === 0 ? url : BASE_URL + url).replace(/\/$/, "");
}

// Cache regex
var AUTHOR_RE = /Tác giả\s*[:\uff1a]?\s*/i;
var STATUS_RE = /Hoàn|Full|DROP|Trọn Bộ/i;
var STATUS_CLS_RE = /status-full|badge-full|label-full|label-hoan/;
var HREF_SKIP_RE = /\/the-loai|\/danh-sach|\/tac-gia|\/chuong-|javascript/;
var HASH_RE = /^#|javascript/; // dùng trong toc lọc href rác

// selectFirst trên Element — vBook chỉ hỗ trợ selectFirst trên Document
function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

// Fetch với retry và User-Agent cho list page (không cần JS)
function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res.ok) res = fetch(url, FETCH_OPTIONS);
    return res;
}

// Fetch bằng browser (cho trang cần JS render như detail/chap)
function fetchBrowser(url) {
    var browser = Engine.newBrowser();
    try {
        return browser.launch(url, 10000);
    } finally {
        browser.close();
    }
}

// Thử HTTP fetch nhanh trước, fallback sang browser nếu trang cần JS
function fetchSmart(url) {
    var res = fetchRetry(url);
    if (res && res.ok) {
        var doc = res.html();
        if (doc) {
            var raw = doc.html();
            if (raw && raw.length > 3000) return doc;
        }
    }
    return fetchBrowser(url);
}

// Parse danh sách truyện từ doc (list/genre/search pages)
function parseList(doc) {
    var result = [];
    var seen = {};
    // Ưu tiên: div.item cards có h3 > a (trang hot/full/thể loại)
    // Kiểm tra nhanh trước khi duyệt từng card — tránh lặp thừa trên homepage
    var cardTitles = doc.select("div.item h3 a[href]");
    if (cardTitles.size() > 0) {
        var cards = doc.select("div.item");
        for (var i = 0; i < cards.size(); i++) {
            var card = cards.get(i);
            var titleLink = selFirst(card, "h3 a[href]");
            if (!titleLink) continue;
            var href = titleLink.attr("href");
            if (!href || href === "/" || HREF_SKIP_RE.test(href)) continue;
            if (seen[href]) continue;
            seen[href] = true;
            var name = titleLink.text().trim();
            if (!name) continue;
            var coverImg = selFirst(card, "img");
            var cover = coverImg ? (coverImg.attr("data-original") || coverImg.attr("data-src") || coverImg.attr("src") || "") : "";
            if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;
            var authorA = selFirst(card, "a[href*='/tac-gia/']");
            var desc = authorA ? authorA.text().trim() : "";
            result.push({ name: name, link: href, host: HOST, cover: cover, description: desc });
            if (result.length >= 30) break;
        }
    }
    // Fallback: duyệt h3 a[href] (trang không có div.item)
    if (result.length === 0) {
        var titleLinks = doc.select("h3 a[href]");
        for (var j = 0; j < titleLinks.size(); j++) {
            var a = titleLinks.get(j);
            var href2 = a.attr("href");
            if (!href2 || href2 === "/" || HREF_SKIP_RE.test(href2)) continue;
            if (seen[href2]) continue;
            seen[href2] = true;
            var name2 = a.text().trim();
            if (!name2) continue;
            var coverImg2 = selFirst(doc, "a[href='" + href2 + "'] img");
            if (!coverImg2) {
                var altHref = href2.indexOf("http") === 0 ? href2.replace(BASE_URL, "") : BASE_URL + href2;
                coverImg2 = selFirst(doc, "a[href='" + altHref + "'] img");
            }
            var cover2 = coverImg2 ? (coverImg2.attr("data-original") || coverImg2.attr("data-src") || coverImg2.attr("src") || "") : "";
            if (cover2 && cover2.charAt(0) === 47) cover2 = BASE_URL + cover2;
            result.push({ name: name2, link: href2, host: HOST, cover: cover2, description: "" });
            if (result.length >= 30) break;
        }
    }
    return result;
}

// Kiểm tra trang tiếp theo — hỗ trợ cả href=?page=N và JS-pagination
var NEXT_PAGE_RE = /[❭›>]|sau|next/i;
function getNextPage(doc, current) {
    // Cách 1: link href trực tiếp
    var next = selFirst(doc, "a[href*='page=" + (current + 1) + "']");
    if (next) return String(current + 1);

    var pager = selFirst(doc,
        ".pagination, .pager, .page-nav, .phan-trang, " +
        "[class*='pagination'], [class*='pager'], ul.pager, nav.pagination"
    );
    if (!pager) return null;

    // Quét số trang trong pager
    var pageEls = pager.select("a, span, li, button");
    var maxNum = 0;
    var hasCurrentNum = false;
    for (var pi = 0; pi < pageEls.size(); pi++) {
        var t = parseInt(pageEls.get(pi).text().trim(), 10);
        if (t > 0) {
            if (t > maxNum) maxNum = t;
            if (t === current) hasCurrentNum = true;
        }
    }

    // current không có trong pager (server redirect về trang 1) → dừng
    if (!hasCurrentNum && current > 1) return null;
    // Có số trang lớn hơn current → còn trang tiếp
    if (maxNum > current) return String(current + 1);
    // Có nút ❭ và current trong pager → còn trang tiếp
    if (hasCurrentNum && NEXT_PAGE_RE.test(pager.text())) return String(current + 1);

    return null;
}

// Dọn HTML thành plain text — 4 pass thay vì 11 để giảm copy string
var ENTITY_MAP = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&nbsp;": " ", "&#160;": " " };
function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/<br\s*\/?>|<p[^>]*>|<\/p>/gi, "\n")  // block tags → newline (1 pass)
        .replace(/<[^>]*>/g, "")                          // strip remaining tags (1 pass)
        .replace(/&[a-z#0-9]+;/gi, function(e) { return ENTITY_MAP[e] || e; }) // entities (1 pass)
        .replace(/\n{3,}/g, "\n\n")                       // collapse blank lines (1 pass)
        .trim();
}
