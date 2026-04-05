load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = fetchBrowser(chapUrl, 8000);
    if (!doc) return null;

    var el = selFirst(doc, "#BookText");
    if (!el) el = selFirst(doc, "#mycontent");
    if (!el) el = selFirst(doc, "#content");
    if (!el) return null;

    el.select("script, style, a, ins, noscript, iframe").remove();
    var html = el.html();
    if (!html) return null;
    return Response.success(html);
}
