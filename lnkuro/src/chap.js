load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = loadDoc(chapUrl);
    if (!doc) return Response.error("Không tải được chương");

    var el = selFirst(doc, ".entry-content.single-page");
    if (!el) el = selFirst(doc, ".entry-content");
    if (!el) return Response.error("Không tìm thấy nội dung chương");

    el.select("script, style, ins, noscript, iframe, button, a, .adsbygoogle, .code-block, .wp-block-buttons, .nav-links, .kuro-settings-wrapper, .blog-share, [class*='ads'], [id*='chapter-nav'], .r18-preview, .entry-header, .entry-meta, #vip-inline-gold-hyper, .vip-cta, .vip-shimmer, .vip-spark").remove();

    // All real content is in <p> tags; divs are noise (VIP banners, announcements, nav, share)
    el.select("> div").remove();

    var html = el.html();
    if (!html || html.trim().length === 0) return Response.error("Nội dung chương trống");

    return Response.success(html);
}
