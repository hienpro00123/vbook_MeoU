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
var STATUS_RE = /Hoàn|Full|DROP/i;
var STATUS_CLS_RE = /status-full|badge-full|label-full|label-hoan/;
var HREF_SKIP_RE = /\/the-loai|\/danh-sach|\/tac-gia|javascript/;
var HASH_RE = /^#|javascript/; // dùng trong toc lọc href rác

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
    // Chọn tất cả link trong H3 (tên truyện)
    var titleLinks = doc.select("h3 a[href]");
    for (var i = 0; i < titleLinks.size(); i++) {
        var a = titleLinks.get(i);
        var href = a.attr("href");
        if (!href || href === "/" || HREF_SKIP_RE.test(href)) continue;
        var name = a.text().trim();
        if (!name) continue;
        var container = a.parent(); // h3
        if (!container) { result.push({ name: name, link: href, host: HOST, cover: "", description: "" }); continue; }
        container = container.parent(); // li or div
        if (!container) { result.push({ name: name, link: href, host: HOST, cover: "", description: "" }); continue; }
        // Ảnh bìa
        var cover = "";
        var imgEl = container.selectFirst("img[src], img[data-src], img[data-original]");
        if (imgEl) {
            cover = imgEl.attr("data-src") || imgEl.attr("data-original") || imgEl.attr("src") || "";
        }
        // Thể loại làm description — giới hạn tối đa 3
        var genreAs = container.select("a[href*='/the-loai/']");
        var desc = "";
        var gLimit = Math.min(genreAs.size(), 3);
        for (var j = 0; j < gLimit; j++) {
            var gt = genreAs.get(j).text().trim();
            if (gt) desc += (desc ? ", " : "") + gt;
        }
        result.push({ name: name, link: href, host: HOST, cover: cover, description: desc });
    }
    return result;
}

// Kiểm tra trang tiếp theo theo pattern ?page=N
function getNextPage(doc, current) {
    var next = doc.selectFirst("a[href*='page=" + (current + 1) + "']");
    return next ? String(current + 1) : null;
}

// Dọn HTML thành plain text — 4 pass thay vì 11 để giảm copy string
var ENTITY_MAP = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&nbsp;": " " };
function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/<br\s*\/?>|<p[^>]*>|<\/p>/gi, "\n")  // block tags → newline (1 pass)
        .replace(/<[^>]*>/g, "")                          // strip remaining tags (1 pass)
        .replace(/&[a-z#0-9]+;/gi, function(e) { return ENTITY_MAP[e] || e; }) // entities (1 pass)
        .replace(/\n{3,}/g, "\n\n")                       // collapse blank lines (1 pass)
        .trim();
}
