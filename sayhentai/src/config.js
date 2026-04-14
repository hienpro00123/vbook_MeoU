var BASE_URL = "https://sayhentai.vc";
var HOST = BASE_URL;

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.7,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

function normalizeSpace(value) {
    return (value || "").replace(/\s+/g, " ").trim();
}

function selectFirst(el, css) {
    var list = el.select(css);
    return list.size() > 0 ? list.get(0) : null;
}

function resolveUrl(url) {
    var value = url || "";
    if (!value) return BASE_URL;
    if (value.indexOf("http://") === 0 || value.indexOf("https://") === 0) return value;
    if (value.indexOf("//") === 0) return "https:" + value;
    return BASE_URL + (value.charAt(0) === "/" ? value : "/" + value);
}

function resolveImageUrl(url) {
    var value = url || "";
    if (!value || value.indexOf("data:") === 0) return "";
    return resolveUrl(value);
}

function fetchRetry(url) {
    var target = resolveUrl(url);
    var res = fetch(target, FETCH_OPTIONS);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(target, FETCH_OPTIONS);
    }
    return res;
}

function buildPagedUrl(url, page) {
    var currentPage = page ? parseInt(page, 10) : 1;
    var target = resolveUrl(url);
    if (!(currentPage > 1)) return target;
    if (/([?&])page=\d+/i.test(target)) {
        return target.replace(/([?&]page=)\d+/i, "$1" + currentPage);
    }
    return target + (target.indexOf("?") >= 0 ? "&" : "?") + "page=" + currentPage;
}

function getNextPage(doc, currentPage) {
    var want = String(currentPage + 1);
    var links = doc.select(".pager a[href], .pager li a[href]");
    for (var i = 0; i < links.size(); i++) {
        if (normalizeSpace(links.get(i).text()) === want) return want;
    }
    return null;
}

function parseListItems(doc) {
    var cards = doc.select(".page-item-detail");
    var items = [];
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var titleLink = selectFirst(card, "h3 a[href]");
        if (!titleLink) titleLink = selectFirst(card, "a[href*='/truyen-']");
        if (!titleLink) continue;

        var name = normalizeSpace(titleLink.text());
        var link = resolveUrl(titleLink.attr("href") || "");
        if (!name || !link) continue;

        var img = selectFirst(card, "img.img-responsive, img");
        var cover = img ? resolveImageUrl(img.attr("data-src") || img.attr("data-original") || img.attr("src") || "") : "";

        var chapterEl = selectFirst(card, ".chapter");
        var description = chapterEl ? normalizeSpace(chapterEl.text()) : "";

        items.push({
            name: name,
            link: link,
            cover: cover,
            description: description,
            host: HOST
        });
    }
    return items;
}

function cleanGenreTitle(text) {
    var title = normalizeSpace(text);
    title = title.replace(/\s+\d[\d\.]*\s+truyện$/i, "");
    title = title.replace(/\s+\d[\d\.]*\s+truyen$/i, "");
    title = title.replace(/^Truyện hentai\s+/i, "");
    title = title.replace(/^truyen hentai\s+/i, "");
    title = title.replace(/\s+[–-]\s*SayHentai.*$/i, "");
    return normalizeSpace(title);
}

function createGenreEntry(name, href) {
    var title = cleanGenreTitle(name);
    var input = resolveUrl(href);
    if (!title || !input || /\/genre\/?$/i.test(input)) return null;
    return {
        title: title,
        input: input,
        script: "genrecontent.js"
    };
}

function collectGenreEntries(links) {
    var items = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var entry = createGenreEntry(a.text(), a.attr("href") || "");
        if (!entry || seen[entry.input]) continue;
        seen[entry.input] = true;
        items.push(entry);
    }
    return items;
}

function collectDetailGenres(doc) {
    var links = doc.select(".genres li a[href*='/genre/'], .genres-content a[href*='/genre/'], .summary-content a[href*='/genre/'], .summary_content a[href*='/genre/'], .post-content_item a[href*='/genre/']");
    if (links.size() === 0) {
        links = doc.select("a[href*='/genre/']");
    }
    return collectGenreEntries(links);
}

function listPageResponse(url, page) {
    var currentPage = page ? parseInt(page, 10) : 1;
    if (!(currentPage > 0)) currentPage = 1;

    var res = fetchRetry(buildPagedUrl(url, currentPage));
    if (!res || !res.ok) return Response.error("Khong tai duoc danh sach");

    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc danh sach");

    var items = parseListItems(doc);
    var next = getNextPage(doc, currentPage);
    return Response.success(items, next);
}