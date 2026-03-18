const BASE_URL = "https://metruyenchu.com.vn";
const HOST = "https://metruyenchu.com.vn";

// Cache headers — khởi tạo 1 lần, tái dùng mãi
var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};

// Fetch với retry và User-Agent cho list page (không cần JS)
function fetchRetry(url) {
    var res = fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) res = fetch(url, { headers: FETCH_HEADERS });
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
            var body = doc.selectFirst("body");
            // Dùng html().length (raw string, không traverse text tree)
            if (body && body.html().length > 1500) return doc;
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
        if (!href || href === "/" ||
            href.indexOf("/the-loai") >= 0 ||
            href.indexOf("/danh-sach") >= 0 ||
            href.indexOf("/tac-gia") >= 0 ||
            href.indexOf("javascript") >= 0) continue;
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

// Dọn HTML thành plain text
function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<br\s*\/?>/gi, "\n")
               .replace(/<p[^>]*>/gi, "\n")
               .replace(/<\/p>/gi, "")
               .replace(/<[^>]*>/g, "")
               .replace(/&amp;/g, "&")
               .replace(/&lt;/g, "<")
               .replace(/&gt;/g, ">")
               .replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&nbsp;/g, " ")
               .replace(/\n{3,}/g, "\n\n")
               .trim();
}
