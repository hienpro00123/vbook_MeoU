load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Không tải được nội dung chương");
    var doc = res.html();
    if (!doc) return Response.error("Không tải được nội dung chương");

    var el = selFirst(doc, ".truyen, #vungdoc");
    if (!el) return Response.error("Không tìm thấy nội dung chương");

    el.select("script, style, a, button, ins, noscript, iframe").remove();
    var html = el.html();
    if (!html) return Response.error("Nội dung chương trống");
    return Response.success(html);
}
