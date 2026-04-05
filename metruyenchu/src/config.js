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
var BG_IMAGE_RE = /url\(['"']?([^'"')\s]+)['"']?\)/; // trích URL từ background-image style

// selectFirst trên Element — vBook chỉ hỗ trợ selectFirst trên Document
function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

// Fetch với retry — bỏ qua 4xx (không retry lỗi client)
function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res.ok && !(res.status >= 400 && res.status < 500)) res = fetch(url, FETCH_OPTIONS);
    return res;
}

// Fetch bằng browser (cho trang cần JS render như detail/chap)
function fetchBrowser(url, timeout) {
    var t = timeout || 7000;
    var browser = Engine.newBrowser();
    try {
        return browser.launch(url, t);
    } finally {
        browser.close();
    }
}

// Thử HTTP fetch nhanh trước, fallback sang browser nếu trang cần JS
function fetchSmart(url) {
    var res = fetchRetry(url);
    if (res && res.ok) {
        var doc = res.html();
        // Kiểm tra có story card hoặc story title — chỉnh xác hơn đếm a[href]
        // tránh false positive khi trang JS-render nhưng nav/footer đã có 6+ links
        if (doc && doc.select("div.item, h3 a[href]").size() > 0) return doc;
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
        // Build cover map O(n) một lần — tránh O(n²) selFirst per link
        var coverMap = {};
        var aImgs = doc.select("a[href]:has(img)");
        for (var ci = 0; ci < aImgs.size(); ci++) {
            var ael = aImgs.get(ci);
            var ah = ael.attr("href") || "";
            if (!ah) continue;
            var normH = ah.indexOf("http") === 0 ? ah.replace(BASE_URL, "") : ah;
            if (coverMap[normH]) continue;
            var aimg = selFirst(ael, "img");
            if (!aimg) continue;
            var asrc = aimg.attr("data-original") || aimg.attr("data-src") || aimg.attr("src") || "";
            if (asrc && asrc.charAt(0) === 47) asrc = BASE_URL + asrc;
            if (asrc) coverMap[normH] = asrc;
        }
        var titleLinks = doc.select("h3 a[href]");
        for (var j = 0; j < titleLinks.size(); j++) {
            var a = titleLinks.get(j);
            var href2 = a.attr("href");
            if (!href2 || href2 === "/" || HREF_SKIP_RE.test(href2)) continue;
            if (seen[href2]) continue;
            seen[href2] = true;
            var name2 = a.text().trim();
            if (!name2) continue;
            var normHref2 = href2.indexOf("http") === 0 ? href2.replace(BASE_URL, "") : href2;
            var cover2 = coverMap[normHref2] || "";
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

    // Phase 1: specific class selectors (fast) — tránh [class*=] scan toàn DOM
    var pager = selFirst(doc, ".pagination, .pager, .page-nav, .phan-trang, ul.pager, nav.pagination");
    // Phase 2: attribute-contains chỉ khi không tìm được bằng class cụ thể
    if (!pager) pager = selFirst(doc, "[class*='pagination'], [class*='pager']");
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

// Dọn HTML thành plain text — 5 pass: block tags, strip tags, entities, whitespace, blank lines
var ENTITY_MAP = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&nbsp;": " ", "&#160;": " " };
function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/<\/p>/gi, "\n\n")                   // đóng <\/p> → xuống đoạn (dòng trắng)
        .replace(/<br[^>]*>(\s*<\/br>)?/gi, "\n\n")    // <br>, <br/>, <br></br> → xuống đoạn
        .replace(/<p[^>]*>|<\/div>|<\/section>|<\/article>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&[a-z#0-9]+;/gi, function(e) { return ENTITY_MAP[e] || e; })
        .replace(/[ \t]+/g, " ")          // chuẩn hóa khoảng trắng ngang
        .replace(/\n[ \t]+/g, "\n")       // bỏ space/tab đầu mỗi dòng
        .replace(/\n{3,}/g, "\n\n")       // tối đa 2 dòng trắng liên tiếp
        .trim();
}
