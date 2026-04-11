load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = fetchDoc(chapUrl);
    if (!doc) return Response.error("");

    var el = selFirst(doc, "#chapter-content");
    if (!el) return Response.error("");

    el.select("script, style, a, ins, noscript, iframe, .ads, .ad, .chapter-nav").remove();
    var html = el.html();
    if (!html) return Response.error("");
    return Response.success(html);
}
