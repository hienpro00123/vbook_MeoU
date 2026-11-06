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

// Phát hiện trang Cloudflare JS Challenge
function isCloudflareChallenge(doc) {
    if (!doc) return false;
    var titleEl = selFirst(doc, "title");
    var title = titleEl ? titleEl.text().toLowerCase() : "";
    if (title.indexOf("just a moment") !== -1) return true;
    if (title.indexOf("attention required") !== -1) return true;
    try {
        var bodyText = (doc.text() || "").toLowerCase();
        return bodyText.indexOf("cloudflare ray id") !== -1
            || bodyText.indexOf("sorry, you have been blocked") !== -1
            || bodyText.indexOf("you are unable to access") !== -1;
    } catch (e) {
        return false;
    }
}

function waitChallenge(browser, doc, maxTries, waitMs) {
    var tries = 0;
    while (doc && isCloudflareChallenge(doc) && tries < maxTries) {
        try {
            doc = browser.html(waitMs);
        } catch (e) {
            break;
        }
        tries++;
    }
    return doc;
}

function fetchBrowser(url, timeout) {
    var t = timeout || 20000;
    var browser = Engine.newBrowser();
    try {
        var doc = browser.launch(url, t);
        doc = waitChallenge(browser, doc, 2, 8000);
        if (doc && isCloudflareChallenge(doc)) return null;
        return doc;
    } catch (e) {
        return null;
    } finally {
        try { browser.close(); } catch (e2) {}
    }
}

function fetchBrowserFast(url) {
    var browser = Engine.newBrowser();
    try {
        var doc = browser.launch(url, 20000);
        doc = waitChallenge(browser, doc, 2, 8000);
        if (doc && isCloudflareChallenge(doc)) return null;
        return doc;
    } catch (e) {
        return null;
    } finally {
        try { browser.close(); } catch (e2) {}
    }
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

function parseItems(items) {
    var result = [];
    var seen = {};
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
        var moreSpans = item.select("dd.more span");
        if (moreSpans.size() >= 2) {
            desc = moreSpans.get(1).text();
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
