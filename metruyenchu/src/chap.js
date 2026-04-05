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

    // </br><br> → xuống dòng
    var text = html
        .replace(/<\/br>\s*<br\s*\/?>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    if (!text) return null;
    return Response.success(text);
}
