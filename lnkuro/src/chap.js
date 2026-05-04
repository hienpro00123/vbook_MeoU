load("config.js");

var CHAPTER_BROWSER_TIMEOUT = 15000;

function hasReadableHtml(html) {
    if (!html) return false;

    var text = html
        .replace(/<br\s*\/?>/gi, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, "")
        .trim();

    return text.length > 0;
}

function toReadableText(html) {
    if (!html) return "";

    return html
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function isLikelyMetadataOnly(html) {
    if (!hasReadableHtml(html)) return true;

    var text = toReadableText(html);
    var paragraphCount = 0;
    var matches = html.match(/<p[\s>]/gi);
    if (matches) paragraphCount = matches.length;

    if (text.indexOf("Số từ") !== -1 && paragraphCount <= 1) return true;
    if (text.indexOf("Chương") === 0 && text.length < 120) return true;

    return false;
}

function buildParagraphHtml(root) {
    var parts = "";
    var paragraphs = root.select("p");

    for (var i = 0; i < paragraphs.size(); i++) {
        var p = paragraphs.get(i);
        var pHtml = p.html();
        var pText = p.text ? p.text().trim() : "";
        if (pText.indexOf("Số từ") === 0) continue;
        if (!hasReadableHtml(pHtml)) continue;
        parts += "<p>" + pHtml + "</p>";
    }

    return parts;
}

function findChapterRoot(doc) {
    var selectors = [
        ".entry-content.single-page .single-page-content",
        ".entry-content.single-page .article-content",
        ".entry-content.single-page .post-content",
        ".entry-content.single-page .content",
        ".entry-content.single-page [class*='chapter-content']",
        ".entry-content.single-page [class*='entry-content-inner']",
        ".entry-content .single-page-content",
        ".entry-content .article-content",
        ".entry-content .post-content",
        ".entry-content .content",
        ".entry-content.single-page",
        ".entry-content",
        "article .entry-content",
        "main .entry-content"
    ];

    for (var i = 0; i < selectors.length; i++) {
        var el = selFirst(doc, selectors[i]);
        if (el) return el;
    }

    return null;
}

function extractChapterHtml(doc) {
    if (!doc) return "";

    var el = findChapterRoot(doc);
    if (!el) return "";

    el.select("script, style, ins, noscript, iframe, button, a, .adsbygoogle, .code-block, .wp-block-buttons, .nav-links, .kuro-settings-wrapper, .blog-share, [class*='ads'], [id*='chapter-nav'], .r18-preview, .entry-header, .entry-meta, #vip-inline-gold-hyper, .vip-cta, .vip-shimmer, .vip-spark").remove();

    var html = el.html();
    if (!hasReadableHtml(html)) html = buildParagraphHtml(el);
    return html;
}

function loadChapterDocWithBrowser(chapUrl) {
    var browser = Engine.newBrowser();
    try {
        return browser.launch(chapUrl, CHAPTER_BROWSER_TIMEOUT);
    } catch (e) {
        return null;
    } finally {
        try { browser.close(); } catch (e2) {}
    }
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = loadDoc(chapUrl);
    if (!doc) return Response.error(getLoadError("Không tải được chương"));

    var html = extractChapterHtml(doc);

    if (isLikelyMetadataOnly(html)) {
        var browserDoc = loadChapterDocWithBrowser(chapUrl);
        var browserHtml = extractChapterHtml(browserDoc);
        if (hasReadableHtml(browserHtml)) html = browserHtml;
    }

    if (!hasReadableHtml(html)) return Response.error("Nội dung chương trống");

    return Response.success(html);
}
