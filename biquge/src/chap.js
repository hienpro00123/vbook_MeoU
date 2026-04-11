load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = fetchBrowserFast(chapUrl);
    if (!doc) return Response.error("");

    var el = selFirst(doc, "#chaptercontent, #content, #BookText, .chapter-content");
    if (!el) return Response.error("");

    el.select("script, style, a, ins, noscript, iframe, .ads, .ad").remove();
    var html = el.html();
    if (!html) return Response.error("");
    return Response.success(html);
}
