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
        // doc.html() bao gồm cả <head>+<body>, dùng ngưỡng cao hơn để loại trang rỗng/redirect
        if (doc && doc.html().length > 3000) return doc;
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
        if (!href || href === "/" || /\/the-loai|\/danh-sach|\/tac-gia|javascript/.test(href)) continue;
        var name = a.text().trim();
        if (!name) continue;
        // Container cha (thường là li hoặc div)
        var container = a.parent(); // h3
        if (container) container = container.parent(); // li or div
        // Ảnh bìa
        var cover = "";
        if (container) {
            var imgEl = container.selectFirst("img[src], img[data-src], img[data-original]");
            if (imgEl) {
                cover = imgEl.attr("data-src") || imgEl.attr("data-original") || imgEl.attr("src") || "";
            }
        }
        // Thể loại làm description — giới hạn tối đa 3 để tránh vong lặp thừa
        var desc = "";
        if (container) {
            var genreAs = container.select("a[href*='/the-loai/']");
            var gs = [];
            var gLimit = Math.min(genreAs.size(), 3);
            for (var j = 0; j < gLimit; j++) {
                var gt = genreAs.get(j).text().trim();
                if (gt) gs.push(gt);
            }
            desc = gs.join(", ");
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
