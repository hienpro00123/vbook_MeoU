load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Không tải được chương");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung");

    var el = selFirst(doc, ".reading-content .text-left, .reading-content, .entry-content, .text-left");
    if (!el) return Response.error("Không tìm thấy nội dung chương");

    el.select("script, style, ins, noscript, iframe, button, .adsbygoogle, .code-block, .wp-block-buttons, .nav-links, .chapter-warning, [class*='ads']").remove();
    el.select("a").remove();

    var html = el.html();
    if (!html || html.trim().length === 0) return Response.error("Nội dung chương trống");

    return Response.success(html);
}
