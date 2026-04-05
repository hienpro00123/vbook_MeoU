load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = fetchBrowser(chapUrl);
    if (!doc) return null;

    var el = selFirst(doc, "#BookText");
    if (!el) el = selFirst(doc, "#mycontent");
    if (!el) el = selFirst(doc, "#content");
    if (!el) return null;

    el.select("script, style, a, ins, noscript, iframe").remove();
    var html = el.html();

    // </p><p> → xuống dòng
    var text = html
        .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    if (!text) return null;
    return Response.success(text);
}
