load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);

    // Chapter page is SSR — try fetch first
    var res = fetchRetry(chapUrl);
    var doc = null;
    if (res && res.ok) {
        doc = res.html();
    }

    // Fallback: browser if fetch fails (Cloudflare)
    if (!doc) {
        var browser = Engine.newBrowser();
        try {
            doc = browser.launch(chapUrl, 15000);
        } catch (e) {
            doc = null;
        }
        try { browser.close(); } catch (e2) {}
    }

    if (!doc) return Response.error("Không tải được nội dung chương");

    // Try multiple selectors for chapter content
    var content = selFirst(doc, ".chapter-content");
    if (!content) content = selFirst(doc, "#chapter-content");
    if (!content) content = selFirst(doc, ".content-chapter");
    if (!content) content = selFirst(doc, ".reading-detail__content");
    if (!content) content = selFirst(doc, "#noidungchuong");

    // Fallback: find the main text container by looking for long text blocks
    if (!content) {
        var divs = doc.select("div, article, section");
        var bestEl = null;
        var bestLen = 0;
        for (var i = 0; i < divs.size(); i++) {
            var div = divs.get(i);
            var textLen = div.text().length;
            // The chapter text should be significant (> 500 chars)
            // but not the entire page (< body text length)
            if (textLen > 500 && textLen > bestLen) {
                // Check it contains mostly text, not many links
                var linkCount = div.select("a").size();
                var tagCount = div.select("*").size();
                // Good content has few links relative to text length
                if (linkCount < textLen / 200) {
                    bestLen = textLen;
                    bestEl = div;
                }
            }
        }
        content = bestEl;
    }

    if (!content) return Response.error("Không tìm thấy nội dung chương");

    // Clean up content
    content.select("script, style, iframe, noscript, ins, button, nav, footer, header").remove();
    content.select("a[href], .audio-player, .ads, .quangcao").remove();

    var html = content.html();
    if (!html || html.length < 50) return Response.error("Nội dung chương trống");

    return Response.success(html);
}
