load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetch(chapUrl, FETCH_OPTIONS);
    if (!res || !res.ok) return null;
    var doc = res.html();
    if (!doc) return null;

    var el = selFirst(doc, ".truyen");
    if (!el) el = selFirst(doc, "#vungdoc");
    if (!el) return null;

    el.select("script, style, a, button, ins, noscript, iframe").remove();
    var html = el.html();
    if (!html) return null;
    return Response.success(html);
}
