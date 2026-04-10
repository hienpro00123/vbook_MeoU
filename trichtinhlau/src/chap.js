load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = fetchBrowser(chapUrl, 15000);
    if (!doc) return Response.error("Không tải được nội dung chương");

    var el = doc.selectFirst(".entry-content.chapter-c");
    if (!el) el = doc.selectFirst(".chapter-c");
    if (!el) el = doc.selectFirst(".entry-content");
    if (!el) return Response.error("Không tìm thấy nội dung chương");

    el.select("script, style, noscript, iframe, ins, button, a").remove();
    var html = el.html();
    if (!html || html.trim().length === 0) return Response.error("Nội dung chương trống");
    return Response.success(html);
}
