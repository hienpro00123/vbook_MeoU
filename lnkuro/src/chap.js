load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Không tải được chương");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung");

    var el = selFirst(doc, ".entry-content.single-page");
    if (!el) el = selFirst(doc, ".entry-content");
    if (!el) return Response.error("Không tìm thấy nội dung chương");

    el.select("script, style, ins, noscript, iframe, button, a, .adsbygoogle, .code-block, .wp-block-buttons, .nav-links, .kuro-settings-wrapper, .blog-share, [class*='ads'], [id*='chapter-nav'], .r18-preview, .entry-header, .entry-meta, #vip-inline-gold-hyper, .vip-cta, .vip-shimmer, .vip-spark").remove();

    // All real content is in <p> tags; divs are noise (VIP banners, announcements, nav, share)
    var kids = el.children();
    for (var j = kids.size() - 1; j >= 0; j--) {
        if (kids.get(j).tagName() == "div") kids.get(j).remove();
    }

    var html = el.html();
    if (!html || html.trim().length === 0) return Response.error("Nội dung chương trống");

    return Response.success(html);
}
