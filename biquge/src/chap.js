load("config.js");

function parseChapterPartInfo(doc) {
    var titleEl = selFirst(doc, "h1");
    var title = titleEl ? titleEl.text() : "";
    var match = /[（(]\s*(\d+)\s*\/\s*(\d+)\s*[）)]/.exec(title || "");
    if (!match) return null;
    return {
        current: parseInt(match[1], 10),
        total: parseInt(match[2], 10)
    };
}

function getChapterTitle(doc) {
    var titleEl = selFirst(doc, "h1");
    var title = titleEl ? titleEl.text() : "";
    title = title.replace(/[（(]\s*\d+\s*\/\s*\d+\s*[）)]/g, "");
    return title.replace(/\s+/g, " ").trim();
}

function normalizeChapterText(html) {
    return stripHtml(html).replace(/\s+/g, " ").trim();
}

function getChapterHtml(doc) {
    var el = selFirst(doc, "#chaptercontent, #content, #BookText, .chapter-content");
    if (!el) return "";

    el.select("script, style, a, ins, noscript, iframe, .ads, .ad").remove();
    return el.html() || "";
}

function buildSplitUrl(chapUrl, part) {
    if (part <= 1) return chapUrl;
    if (/\.html(?:[?#].*)?$/i.test(chapUrl)) {
        return chapUrl.replace(/\.html((?:[?#].*)?)$/i, "_" + part + ".html$1");
    }
    return chapUrl + "_" + part;
}

function shouldAppendPart(baseTitle, part, extraDoc, extraText, seenTexts) {
    if (!extraText) return false;

    var extraTitle = getChapterTitle(extraDoc);
    if (baseTitle && extraTitle && extraTitle !== baseTitle) return false;

    var extraInfo = parseChapterPartInfo(extraDoc);
    if (extraInfo) {
        if (extraInfo.current !== part) return false;
        if (extraInfo.total > 0 && extraInfo.total < extraInfo.current) return false;
    }

    return !seenTexts[extraText];
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = fetchBrowserFast(chapUrl);
    if (!doc) return Response.error("");

    var html = getChapterHtml(doc);
    if (!html) return Response.error("");

    var partInfo = parseChapterPartInfo(doc);
    var baseTitle = getChapterTitle(doc);
    var parts = [html];
    var seenTexts = {};
    var baseText = normalizeChapterText(html);

    if (baseText) seenTexts[baseText] = true;

    var maxProbePart = 50;
    for (var part = 2; part <= maxProbePart; part++) {
        var extraDoc = fetchBrowserFast(buildSplitUrl(chapUrl, part));
        if (!extraDoc) break;

        var extraHtml = getChapterHtml(extraDoc);
        if (!extraHtml) break;

        var extraText = normalizeChapterText(extraHtml);
        if (!shouldAppendPart(baseTitle, part, extraDoc, extraText, seenTexts)) break;

        parts.push(extraHtml);
        seenTexts[extraText] = true;

        if (partInfo && partInfo.total > 1 && part >= partInfo.total) break;
    }

    return Response.success(parts.join(""));
}
