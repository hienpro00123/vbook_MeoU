var BASE_URL = "https://www.municipiodaboavista.com";
var HOST = "https://www.municipiodaboavista.com";
var REST_URL = "https://www.municipiodaboavista.com/wp-json/wp/v2";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Referer": "https://www.municipiodaboavista.com/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };
var PAGE_SIZE = 12;
var REST_FIELDS = "id,link,title,featured_media";
// 18+ / Adult / Smut: ẩn khỏi các tab duyệt mặc định, vẫn xem được qua thể loại
var ADULT_CATEGORIES = "59,55,58";

function selFirst(el, css) {
    if (!el) return null;
    var r = el.select(css);
    return r && r.size() > 0 ? r.get(0) : null;
}

function fetchRetry(url) {
    var res = fetch(url, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) res = fetch(url, FETCH_OPTIONS);
    return res;
}

function cleanImgSrc(img) {
    if (!img) return "";
    var src = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
    if (src.indexOf("data:") === 0) return "";
    return src;
}

function decodeEntities(text) {
    if (!text) return "";
    var s = String(text).replace(/<[^>]*>/g, "");
    s = s.replace(/&#x([0-9a-fA-F]+);/g, function (m, h) {
        var c = parseInt(h, 16);
        return isNaN(c) ? m : String.fromCharCode(c);
    });
    s = s.replace(/&#(\d+);/g, function (m, d) {
        var c = parseInt(d, 10);
        return isNaN(c) ? m : String.fromCharCode(c);
    });
    var named = [
        ["&nbsp;", " "], ["&amp;", "&"], ["&lt;", "<"], ["&gt;", ">"],
        ["&quot;", '"'], ["&apos;", "'"], ["&hellip;", "..."], ["&ndash;", "-"], ["&mdash;", "-"]
    ];
    for (var i = 0; i < named.length; i++) {
        s = s.split(named[i][0]).join(named[i][1]);
    }
    return s.replace(/\s+/g, " ").trim();
}

function restFetch(path) {
    return fetchRetry(REST_URL + path);
}

function restJson(res) {
    if (!res || !res.ok) return null;
    var data = null;
    try { data = res.json(); } catch (e) { return null; }
    return data;
}

function restTotalPages(res) {
    if (!res) return 0;
    var raw = "";
    try {
        if (typeof res.header === "function") raw = res.header("X-WP-TotalPages") || "";
    } catch (e) { raw = ""; }
    if (!raw) {
        try {
            var h = res.headers || {};
            raw = h["X-WP-TotalPages"] || h["x-wp-totalpages"] || "";
        } catch (e2) { raw = ""; }
    }
    var n = parseInt(raw, 10);
    return isNaN(n) ? 0 : n;
}

// Cover URLs are a separate media lookup: keep list payloads small.
function coversByIds(ids) {
    var map = {};
    if (!ids || ids.length === 0) return map;
    var res = restFetch("/media?include=" + ids.join(",") + "&per_page=" + ids.length + "&_fields=id,source_url");
    var arr = restJson(res);
    if (!arr || !arr.length) return map;
    for (var i = 0; i < arr.length; i++) {
        var m = arr[i];
        if (m && m.id) map[String(m.id)] = m.source_url || "";
    }
    return map;
}

function restToItems(arr) {
    var list = [];
    if (!arr || !arr.length) return list;
    var ids = [];
    for (var i = 0; i < arr.length; i++) {
        var it = arr[i];
        if (!it || !it.link) continue;
        var fm = it.featured_media ? String(it.featured_media) : "";
        if (fm && fm !== "0" && ids.indexOf(fm) < 0) ids.push(fm);
    }
    var covers = coversByIds(ids);
    for (var j = 0; j < arr.length; j++) {
        var o = arr[j];
        if (!o || !o.link) continue;
        var name = o.title ? decodeEntities(o.title.rendered || "") : "";
        if (!name) continue;
        var key = o.featured_media ? String(o.featured_media) : "";
        list.push({
            name: name,
            link: o.link,
            host: HOST,
            cover: (key && covers[key]) || "",
            description: ""
        });
    }
    return list;
}

// One REST listing request -> { items, next }
function restList(path, page) {
    var res = restFetch(path);
    var arr = restJson(res);
    var items = restToItems(arr);
    var totalPages = restTotalPages(res);
    var next = null;
    if (totalPages > 0) {
        if (page < totalPages) next = String(page + 1);
    } else if (items.length >= PAGE_SIZE) {
        next = String(page + 1);
    }
    return { items: items, next: next };
}

function pageNum(page) {
    var p = parseInt(page, 10);
    if (isNaN(p) || p < 1) p = 1;
    return p;
}

// Parse the swiper/grid items still rendered server-side (detail-page relations)
function parseListItems(doc) {
    var list = [];
    if (!doc) return list;
    var nodes = doc.select("div.manga-item");
    for (var i = 0; i < nodes.size(); i++) {
        var item = nodes.get(i);
        var a = selFirst(item, "a[href]");
        if (!a) continue;
        var link = a.attr("href") || "";
        if (link.indexOf("/truyen-tranh/") < 0) continue;
        var titleEl = selFirst(item, ".manga-title");
        var name = titleEl ? decodeEntities(titleEl.text()) : "";
        if (!name) name = decodeEntities(a.attr("title") || "");
        if (!name) continue;
        var chapEl = selFirst(item, ".latest-chap a");
        list.push({
            name: name,
            link: link,
            host: HOST,
            cover: cleanImgSrc(selFirst(item, "img")),
            description: chapEl ? chapEl.text().trim() : ""
        });
    }
    return list;
}
