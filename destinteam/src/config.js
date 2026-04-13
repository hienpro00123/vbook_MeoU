var HOST = "https://destinteam.com";
var BASE_URL = HOST;

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

var TITLE_SKIP_RE = /^(Đọc|Từ đầu|Truyện mới|Trang trước|Trang sau|Trước|Sau|Quay về truyện|Danh sách chương|Mở rộng mô tả|18\+|MỚI)$/i;
var DETAIL_PATH_RE = /\/truyen\/[^\/?#]+\/?$/i;
var CHAPTER_PATH_RE = /\/truyen\/[^\/?#]+\/chapter-[^\/?#]+\/?$/i;

function fetchDoc(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res || !res.ok) return null;
    return res.html();
}

function fetchJson(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res || !res.ok) return null;
    return res.json();
}

function selFirst(el, css) {
    var result = el.select(css);
    return result.size() > 0 ? result.get(0) : null;
}

function normalizeSpace(text) {
    return (text || "").replace(/\s+/g, " ").trim();
}

function resolveUrl(url) {
    if (!url) return "";
    if (url.indexOf("http") === 0) return stripHash(url);
    if (url.indexOf("//") === 0) return "https:" + stripHash(url);
    if (url.charAt(0) === "/") return stripHash(BASE_URL + url);
    return stripHash(BASE_URL + "/" + url);
}

function stripHash(url) {
    return (url || "").replace(/#.*$/, "");
}

function toRelativeUrl(url) {
    return stripHash(resolveUrl(url)).replace(BASE_URL, "");
}

function getImageUrl(imgEl) {
    if (!imgEl) return "";
    var imageUrl = imgEl.attr("data-original-src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || imgEl.attr("src") || "";
    imageUrl = normalizeSpace(imageUrl);
    if (!imageUrl || imageUrl.indexOf("data:image/svg+xml") === 0) return "";
    return resolveUrl(imageUrl);
}

function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/(<br[^>]*>\s*)+/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;|&#8221;/g, '"')
        .replace(/&#8230;/g, "...")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function getDetailJsonUrl(doc) {
    var link = selFirst(doc, "link[rel='alternate'][type='application/json']");
    if (link) return normalizeSpace(link.attr("href"));

    var html = doc.html ? doc.html() : "";
    var match = html.match(/https?:\\/\\/[^"']+\\/wp-json\\/wp\\/v2\\/manga\\/\d+/i);
    return match ? match[0] : "";
}

function getMangaId(doc) {
    var jsonUrl = getDetailJsonUrl(doc);
    var match = jsonUrl.match(/\/wp-json\/wp\/v2\/manga\/(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
}

function getCoverFromDoc(doc) {
    var cover = selFirst(doc, "img[alt^='Ảnh bìa của'], .story-cover img, .story-cover-wrap img");
    return getImageUrl(cover);
}

function parseList(doc) {
    var anchors = doc.select("a[href*='/truyen/']");
    var byHref = {};
    var order = [];

    for (var i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        var href = resolveUrl(a.attr("href") || "");
        if (!href || !DETAIL_PATH_RE.test(href) || CHAPTER_PATH_RE.test(href)) continue;

        var relative = toRelativeUrl(href);
        if (!byHref[relative]) {
            byHref[relative] = {
                name: "",
                link: relative,
                host: HOST,
                cover: "",
                description: ""
            };
            order.push(relative);
        }

        var item = byHref[relative];
        var img = selFirst(a, "img");
        if (img && !item.cover) item.cover = getImageUrl(img);

        if (item.name) continue;

        var title = normalizeSpace(a.text()).replace(/^Ảnh bìa của\s*/i, "");
        var hasHeading = (a.attr("class") || "").indexOf("uk-link-heading") !== -1 || a.select("h1, h2, h3, h4").size() > 0;

        if (title && title.length > 1 && !TITLE_SKIP_RE.test(title) && (hasHeading || !img)) {
            item.name = title;
            continue;
        }

        if (img) {
            var alt = normalizeSpace(img.attr("alt")).replace(/^Ảnh bìa của\s*/i, "");
            if (alt && alt.length > 1 && !TITLE_SKIP_RE.test(alt)) item.name = alt;
        }
    }

    var items = [];
    for (var j = 0; j < order.length; j++) {
        var key = order[j];
        if (!byHref[key].name) continue;
        items.push(byHref[key]);
        if (items.length >= 30) break;
    }
    return items;
}

function getNextPage(doc, currentPage) {
    var nextLink = selFirst(doc, ".uk-pagination a[rel='next'], a[rel='next'], .next.page-numbers, .uk-pagination .next a");
    if (nextLink) return String(currentPage + 1);
    return null;
}