var BASE_URL = "https://truyenkimdung.net";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (error) {
}

function absoluteUrl(url) {
    url = String(url || "").trim();
    if (!url) return BASE_URL;
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (/^https?:\/\/(?:www\.)?truyenkimdung\.net(?:\/|$)/i.test(url)) {
        return BASE_URL + url.replace(/^https?:\/\/(?:www\.)?truyenkimdung\.net/i, "");
    }
    if (url.indexOf(BASE_URL + "/") === 0 || url === BASE_URL) return url;
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return "";
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function setQuery(url, name, value) {
    var re = new RegExp("([?&])" + name + "=[^&]*");
    if (re.test(url)) return url.replace(re, "$1" + name + "=" + encodeURIComponent(String(value)));
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + name + "=" + encodeURIComponent(String(value));
}

function listUrl(input, page) {
    var url = absoluteUrl(input || "/");
    url = setQuery(url, "page", page || 1);
    return setQuery(url, "pageSize", 100);
}

function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
}

function parseStoryList(doc) {
    var cards = doc.select(".story-card[href]");
    var items = [];
    var seen = {};
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var link = absoluteUrl(card.attr("href"));
        var name = cleanText(card.select("h2").text());
        if (!link || !name || seen[link]) continue;
        seen[link] = true;
        items.push({
            name: name,
            link: link,
            host: BASE_URL,
            cover: absoluteUrl(card.select(".cover img").attr("src")),
            description: cleanText(card.select(".meta").text()),
            tag: cleanText(card.select(".cover-tags").text())
        });
    }
    return items;
}

function nextListPage(doc, currentPage) {
    var summary = cleanText(doc.select(".pagination-summary").text());
    var match = /Hiển thị\s+(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)/.exec(summary);
    if (!match) return null;
    if (parseInt(match[2], 10) < parseInt(match[3], 10)) return String(currentPage + 1);
    return null;
}

function storyVersion(metaText) {
    var match = /(Tân tu|Bản cũ|Truyện ngắn)/.exec(String(metaText || ""));
    return match ? match[1] : "";
}

function cleanChapterHtml(html) {
    html = String(html || "");
    html = html.replace(/<!--[\s\S]*?-->/g, "");
    html = html.replace(/<o:p\b[^>]*>\s*<\/o:p>/gi, "");
    html = html.replace(/<\/?o:p\b[^>]*>/gi, "");
    for (var i = 0; i < 5; i++) {
        var next = html.replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "$1");
        if (next === html) break;
        html = next;
    }
    html = html.replace(/\s(?:class|style|lang|xml:lang|xml:space|align)="[^"]*"/gi, "");
    html = html.replace(/<p\b[^>]*>\s*(?:&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, "");
    return html.trim();
}
