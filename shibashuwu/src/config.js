var BASE_URL = "https://www.shibashuwu.net";
var HOST = BASE_URL;
var DEFAULT_COVER = BASE_URL + "/17mb/images/default.jpg";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

var BOOK_RE = /\/book\/\d+\/?$/;
var CHAPTER_RE = /\/book\/\d+\/\d+\.html$/;
var CATEGORY_LINK_RE = /\/category\/(\d+)\/?$/;
var WRITER_RE = /\/writer\/\d+\/?$/;

var CATEGORY_TABS = [
    { title: "全部", input: "category:0" },
    { title: "完本", input: "finish:0" },
    { title: "耽美轻文", input: "category:1" },
    { title: "耽美辣文", input: "category:2" },
    { title: "言情轻文", input: "category:3" },
    { title: "言情辣文", input: "category:4" },
    { title: "女女百合", input: "category:5" },
    { title: "超爽辣文", input: "category:6" },
    { title: "男男辣文", input: "category:7" },
    { title: "浓情辣文", input: "category:8" },
    { title: "私密趣事", input: "category:9" },
    { title: "评书品书", input: "category:10" }
];

function selFirst(el, css) {
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function cleanText(text) {
    return (text || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function adultName(name) {
    var value = cleanText(name);
    if (!value) return "";
    return value.indexOf("18+ ") === 0 ? value : "18+ " + value;
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function stripHost(url) {
    var full = resolveUrl(url);
    if (full.indexOf(BASE_URL) === 0) return full.substring(BASE_URL.length);
    return full;
}

function cloneHeaders() {
    return {
        "User-Agent": FETCH_HEADERS["User-Agent"],
        "Accept": FETCH_HEADERS["Accept"],
        "Accept-Language": FETCH_HEADERS["Accept-Language"],
        "Referer": FETCH_HEADERS["Referer"]
    };
}

function fetchRetry(url, options) {
    var opt = options || FETCH_OPTIONS;
    var res = fetch(url, opt);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, opt);
    }
    return res;
}

function fetchBrowser(url, timeout) {
    var browser = Engine.newBrowser();
    try {
        return browser.launch(url, timeout || 12000);
    } finally {
        try {
            browser.close();
        } catch (e) {}
    }
}

function isValidDetailDoc(doc) {
    if (!doc) return false;

    var titleEl = selFirst(doc, "h1 a[href*='/book/'], h1");
    var title = titleEl ? cleanText(titleEl.text()) : "";
    if (!title) return false;

    var lowerTitle = title.toLowerCase();
    return lowerTitle.indexOf("404") === -1 && lowerTitle.indexOf("not found") === -1;
}

function buildPostOptions(body) {
    var headers = cloneHeaders();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    return {
        method: "POST",
        headers: headers,
        body: body
    };
}

function extractCover(el) {
    var imgEl = selFirst(el, "img[_src], img[data-src], img[data-original], img[src]");
    if (!imgEl) return DEFAULT_COVER;

    var lazy = imgEl.attr("_src") || imgEl.attr("data-src") || imgEl.attr("data-original") || "";
    var src = lazy || imgEl.attr("src") || "";
    src = resolveUrl(src);
    if (src.indexOf("/17mb/images/enter.png") !== -1) return DEFAULT_COVER;
    return src || DEFAULT_COVER;
}

function buildCategoryUrl(input, pageNum) {
    var parts = (input || "category:0").split(":");
    var mode = parts[0];
    var categoryId = parts.length > 1 ? parts[1] : "0";
    var path = mode === "finish" ? "/category/finish/" + categoryId + "/" : "/category/" + categoryId + "/";

    if (pageNum > 1) {
        path += pageNum + ".html";
    }

    return BASE_URL + path;
}

function buildGenre(categoryText, categoryHref) {
    var match = CATEGORY_LINK_RE.exec(resolveUrl(categoryHref));
    if (!match) return null;
    return {
        title: cleanText(categoryText),
        input: "category:" + match[1],
        script: "genrecontent.js"
    };
}

function pushItem(result, seen, name, href, cover, description) {
    var full = resolveUrl(href);
    if (!BOOK_RE.test(full)) return;

    var link = stripHost(full);
    if (seen[link]) return;
    seen[link] = true;

    result.push({
        name: adultName(name),
        link: link,
        host: HOST,
        cover: cover || DEFAULT_COVER,
        description: cleanText(description)
    });
}

function parseThumbItems(root) {
    var result = [];
    var seen = {};
    var items = root.select("li");

    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        var titleA = selFirst(item, "div.book_img_name a[href*='/book/'], a[href*='/book/'][title], a[href*='/book/']");
        if (!titleA) continue;

        var href = titleA.attr("href") || "";
        var name = cleanText(titleA.text() || titleA.attr("title"));
        if (!name || name === "阅读本书") continue;

        pushItem(result, seen, name, href, extractCover(item), "");
    }

    return result;
}

function parseCategoryItems(doc) {
    var result = [];
    var seen = {};
    var units = doc.select(".CGsectionTwo-right-content-unit");

    for (var i = 0; i < units.size(); i++) {
        var unit = units.get(i);
        var titleA = selFirst(unit, "a.title[href*='/book/'], p a[href*='/book/']");
        if (!titleA) continue;

        var name = cleanText(titleA.text());
        if (!name || name === "阅读本书") continue;

        var authorA = selFirst(unit, "a[href*='/writer/']");
        var description = authorA ? "作者: " + cleanText(authorA.text()) : "";
        var paragraphs = unit.select("p");
        if (paragraphs.size() > 2) {
            var summary = cleanText(paragraphs.get(2).text());
            if (summary) description = description ? description + " / " + summary : summary;
        }

        pushItem(result, seen, name, titleA.attr("href"), extractCover(unit), description);
    }

    if (result.length > 0) return result;
    return parseThumbItems(doc);
}

function getCategoryNextPage(doc, pageNum) {
    var nextA = selFirst(doc, "a:matchesOwn(下页), a:matchesOwn(下一页)");
    return nextA ? String(pageNum + 1) : null;
}

function executeCategory(input, page) {
    var pageNum = parseInt(page || "1", 10);
    if (!pageNum || pageNum < 1) pageNum = 1;

    var res = fetchRetry(buildCategoryUrl(input, pageNum));
    if (!res || !res.ok) {
        return Response.error("Khong tai duoc danh sach truyen");
    }

    var doc = res.html();
    return Response.success(parseCategoryItems(doc), getCategoryNextPage(doc, pageNum));
}

function parseSearchItems(doc) {
    var result = [];
    var seen = {};
    var paragraphs = doc.select("p");

    for (var i = 0; i < paragraphs.size(); i++) {
        var p = paragraphs.get(i);
        var bookA = selFirst(p, "a[href*='/book/']");
        if (!bookA) continue;

        var name = cleanText(bookA.text());
        if (!name || name === "阅读本书") continue;

        var authorA = selFirst(p, "a[href*='/writer/']");
        var categoryA = null;
        var links = p.select("a[href]");
        for (var li = 0; li < links.size(); li++) {
            var link = links.get(li);
            var href = resolveUrl(link.attr("href") || "");
            if (CATEGORY_LINK_RE.test(href)) {
                categoryA = link;
                break;
            }
        }

        var description = "";
        if (categoryA) description += "[" + cleanText(categoryA.text()) + "] ";
        if (authorA) description += cleanText(authorA.text());

        pushItem(result, seen, name, bookA.attr("href"), DEFAULT_COVER, description);
    }

    return result;
}

function collectSuggests(doc, currentUrl) {
    var result = [];
    var seen = {};
    var links = doc.select("a[href*='/book/']");
    var current = resolveUrl(currentUrl);

    for (var i = 0; i < links.size(); i++) {
        var link = links.get(i);
        var href = resolveUrl(link.attr("href") || "");
        if (!BOOK_RE.test(href) || href === current) continue;

        var name = cleanText(link.text() || link.attr("title"));
        if (!name || name === "阅读本书") continue;

        var key = stripHost(href);
        if (seen[key]) continue;
        seen[key] = true;

        result.push({
            name: adultName(name),
            link: key,
            host: HOST
        });

        if (result.length >= 12) break;
    }

    return result;
}
