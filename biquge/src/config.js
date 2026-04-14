var HOST = "https://www.biquge.tw";
var BASE_URL = "https://www.biquge.tw";
var BOOK_RE = /\/book\/(\d+)\.html/;

function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

function resolveUrl(url) {
    if (!url) return "";
    if (url.indexOf("http") === 0) return url;
    return BASE_URL + url;
}

function fetchBrowser(url, timeout) {
    var t = timeout || 8000;
    var browser = Engine.newBrowser();
    try {
        return browser.launch(url, t);
    } finally {
        browser.close();
    }
}

function fetchBrowserFast(url) {
    return fetchBrowser(url, 6000);
}

function parseList(doc) {
    var items = doc.select("div.item");
    if (items.size() > 0) return parseItems(items);

    var result = [];
    var seen = {};
    var coverMap = {};

    var imgLinks = doc.select("a[href]:has(img)");
    for (var ci = 0; ci < imgLinks.size(); ci++) {
        var ael = imgLinks.get(ci);
        var ah = ael.attr("href") || "";
        if (!BOOK_RE.test(ah)) continue;
        var img = selFirst(ael, "img");
        if (!img) continue;
        var src = img.attr("data-src") || img.attr("src") || "";
        if (src && src.indexOf("nocover") !== -1) src = "";
        if (src && !coverMap[ah]) coverMap[ah] = src;
    }

    var allLinks = doc.select("a[href*='/book/']");

    for (var i = 0; i < allLinks.size(); i++) {
        var a = allLinks.get(i);
        var href = a.attr("href") || "";
        if (!BOOK_RE.test(href)) continue;
        if (seen[href]) continue;
        var name = a.attr("title") || a.text().trim();
        if (!name || name.length < 2 || name.length > 100) continue;
        seen[href] = true;
        result.push({
            name: name,
            link: href,
            host: HOST,
            cover: coverMap[href] || "",
            description: ""
        });
        if (result.length >= 30) break;
    }
    return result;
}

function getLatestChapter(href) {
    try {
        var url = resolveUrl(href);
        var res = fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36" }
        });
        if (res && res.ok) {
            var doc = res.html();
            var meta = selFirst(doc, "meta[property=og:novel:lastest_chapter_name]");
            if (meta) return meta.attr("content") || "";
        }
    } catch(e) {}
    return "";
}

function parseItems(items) {
    var result = [];
    var seen = {};
    var canFetch = -1;
    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        var link = selFirst(item, "dt a[href], a[href*='/book/']");
        if (!link) continue;
        var href = link.attr("href") || "";
        if (!BOOK_RE.test(href) || seen[href]) continue;
        seen[href] = true;
        var name = link.attr("title") || link.text().trim();
        if (!name || name.length < 2) continue;
        var img = selFirst(item, "img");
        var cover = "";
        if (img) {
            cover = img.attr("data-src") || img.attr("src") || "";
            if (cover.indexOf("nocover") !== -1) cover = "";
        }
        var desc = "";
        if (canFetch !== 0) {
            var ch = getLatestChapter(href);
            if (ch) {
                desc = ch;
                canFetch = 1;
            } else if (canFetch === -1) {
                canFetch = 0;
            }
        }
        if (!desc) {
            var moreSpans = item.select("dd.more span");
            if (moreSpans.size() >= 2) {
                desc = moreSpans.get(1).text();
            }
        }
        result.push({
            name: name,
            link: href,
            host: HOST,
            cover: cover,
            description: desc
        });
        if (result.length >= 30) break;
    }
    return result;
}

function stripHtml(html) {
    if (!html) return "";
    return html
        .replace(/(<br[^>]*>\s*(<\/br>)?\s*)+/gi, "\n\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/<\/(div|section|article|blockquote)>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/&#160;/g, " ")
        .replace(/[ \t\r]+/g, " ")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
