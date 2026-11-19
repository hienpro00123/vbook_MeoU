var BASE_URL = "https://manga-bay.biz";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}
BASE_URL = BASE_URL.replace(/\/+$/, "");

function normalizeUrl(url) {
    url = String(url || "");
    if (!url) return BASE_URL;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (/^https?:\/\//i.test(url)) return url;
    return BASE_URL + (url.indexOf("/") === 0 ? "" : "/") + url;
}

function mangaBayDocument(url) {
    var browser = Engine.newBrowser();
    try {
        browser.launch(url, 5000);
        // Windows wraps the encoded DOM in a JSON string; Android returns it directly.
        var result = browser.callJs("encodeURIComponent(document.documentElement.outerHTML)", 5000);
        var encoded = result.select("body").text();
        var html = decodeURIComponent(encoded.charAt(0) === '"' ? JSON.parse(encoded) : encoded);
        var doc = Html.parse(html);
        if (doc.select("main").isEmpty()) {
            throw new Error("Không tải được nội dung Manga-Bay");
        }
        return doc;
    } finally {
        browser.close();
    }
}

function mangaBayImage(img) {
    if (!img) return "";
    return img.attr("data-original") || img.attr("data-src") || img.attr("src") || "";
}

function mangaBayItems(doc, selector) {
    var cards = doc.select(selector || "main a[href*='.html']");
    if (cards.isEmpty()) cards = doc.select("main a[href*='.html']");

    var items = [];
    var seen = [];
    cards.forEach(function (card) {
        var link = card;
        var href = link.attr("href");
        if (!href || href.indexOf(".html") === -1) {
            var links = card.select("a[href*='.html']");
            if (links.isEmpty()) return;
            link = links.first();
            href = link.attr("href");
        }

        var itemUrl = normalizeUrl(href);
        if (!itemUrl || seen.indexOf(itemUrl) !== -1) return;
        seen.push(itemUrl);

        var imageElement = card.select("img").first();
        var image = mangaBayImage(imageElement);
        var name = imageElement ? imageElement.attr("alt") : "";
        if (name.indexOf("Poster for the manga ") === 0) {
            name = name.substring("Poster for the manga ".length);
        }
        if (!name) name = mangaBayTitleFromUrl(itemUrl);
        if (!name) name = link.text();
        if (!name) return;

        var description = card.text().split(name).join("").replace(/\s+/g, " ").trim();
        var status = description.match(/\b(ongoing|completed)\b/i);
        var tag = status ? status[1] : (description.indexOf("18+") !== -1 ? "18+" : "");
        items.push({
            name: name,
            cover: image ? normalizeUrl(image) : "",
            link: itemUrl,
            description: description,
            tag: tag
        });
    });
    return items;
}

function mangaBayTitleFromUrl(url) {
    var match = url.split("?")[0].match(/\/[0-9]+-(.+)\.html$/i);
    if (!match) return "";
    return match[1].replace(/-/g, " ").replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
    });
}

function mangaBayGenreData() {
    var doc = mangaBayDocument(BASE_URL + "/comix/");
    var dataText = "";
    doc.select("script").forEach(function (script) {
        if (dataText) return;
        var match = script.html().match(/^\s*window\.__XFILTER__\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
        if (match) dataText = match[1];
    });
    if (!dataText) return { error: "Không tìm thấy danh sách thể loại Manga-Bay" };

    var data;
    try {
        data = JSON.parse(dataText);
    } catch (error) {
        return { error: "Dữ liệu thể loại Manga-Bay không hợp lệ" };
    }
    var values = data && data.filter_items && data.filter_items.g && data.filter_items.g.values;
    if (!Array.isArray(values) || !values.length) {
        return { error: "Danh sách thể loại Manga-Bay không hợp lệ" };
    }

    var genres = [];
    var seen = [];
    for (var i = 0; i < values.length; i++) {
        var genre = values[i];
        if (!genre || !/^\d+$/.test(String(genre.id)) || typeof genre.value !== "string" || !genre.value.trim()) {
            return { error: "Dữ liệu thể loại không hợp lệ tại vị trí " + (i + 1) };
        }
        var id = String(genre.id);
        if (seen.indexOf(id) !== -1) continue;
        seen.push(id);
        genres.push({
            title: genre.value.trim(),
            input: normalizeUrl("/ComicList/g=" + id + "/"),
            script: "search.js"
        });
    }
    return { genres: genres };
}

function mangaBayPageUrl(path, page) {
    var url = normalizeUrl(path);
    var pageNumber = parseInt(page, 10);
    if (pageNumber > 1) {
        url = url.replace(/\/+$/, "") + "/page/" + pageNumber + "/";
    }
    return url;
}

function mangaBayNextPage(doc, currentPage) {
    var pageNumber = parseInt(currentPage, 10);
    if (isNaN(pageNumber)) pageNumber = 1;
    var nextPage = 0;
    var nextLinks = doc.select("a[href*='/page/']");
    nextLinks.forEach(function (link) {
        var match = link.attr("href").match(/\/page\/([0-9]+)\/?$/);
        if (!match) return;
        var candidate = parseInt(match[1], 10);
        if (candidate > pageNumber && (!nextPage || candidate < nextPage)) {
            nextPage = candidate;
        }
    });
    if (nextPage) return String(nextPage);

    var controls = doc.select("a[rel=next], .pagination a");
    var hasNext = false;
    controls.forEach(function (link) {
        var label = link.text().toLowerCase();
        if (label.indexOf("next") !== -1 || label.indexOf("»") !== -1 || label.indexOf("›") !== -1) {
            hasNext = true;
        }
    });
    return hasNext ? String(pageNumber + 1) : "";
}
