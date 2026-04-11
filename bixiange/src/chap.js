load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = fetchBrowserFast(chapUrl); // chương đơn giản — 5000ms đủ
    if (!doc) return Response.error("Lỗi tải nội dung chương");

    var el = selFirst(doc, "#BookText, #mycontent, #content");
    if (!el) return Response.error("Không tìm thấy nội dung chương");

    el.select("script, style, a, ins, noscript, iframe").remove();
    var html = el.html();
    if (!html) return Response.error("Nội dung chương trống");
    return Response.success(html);
}
