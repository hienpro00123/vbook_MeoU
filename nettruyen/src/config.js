var BASE_URL = "https://nettruyen.work";
var HOST = "https://nettruyen.work";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Referer": "https://nettruyen.work/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) res = fetch(url, FETCH_OPTIONS);
    return res;
}

// Parse figure.clearfix list items
function parseListItems(doc) {
    var items = doc.select("figure.clearfix");
    var list = [];
    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        var a = selFirst(item, "figcaption h3 a");
        if (!a) continue;
        var img = selFirst(item, "div.image a img");
        var cover = "";
        if (img) {
            cover = img.attr("data-original") || img.attr("src") || "";
        }
        var link = a.attr("href") || "";
        list.push({
            name: a.text().trim(),
            link: link,
            host: HOST,
            cover: cover,
            description: ""
        });
    }
    return list;
}

// Check if there is a next page
function getNextPage(doc, currentPage) {
    var nextA = selFirst(doc, ".pagination a[rel=next]");
    if (nextA) return String(currentPage + 1);
    var pages = doc.select(".pagination a");
    for (var i = 0; i < pages.size(); i++) {
        var href = pages.get(i).attr("href") || "";
        var m = /[?&]page=(\d+)/.exec(href);
        if (m && parseInt(m[1]) > currentPage) return String(currentPage + 1);
    }
    return null;
}
