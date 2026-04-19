load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = null;
    var res = fetchRetry(chapUrl);
    if (res && res.ok) doc = res.html();

    // Path 1: base64 decode từ data-encoded (nội dung sạch, không có print-msg hay no-copy-word)
    if (doc) {
        var encEl = selFirst(doc, "#chapterContentEncoded");
        if (encEl) {
            var encoded = encEl.attr("data-encoded");
            if (encoded && encoded.length > 0) {
                try {
                    var decoded = String(new java.lang.String(
                        java.util.Base64.getDecoder().decode(encoded), "UTF-8"
                    ));
                    if (decoded && decoded.trim().length > 0) return Response.success(decoded);
                } catch (e) {}
                try {
                    var decoded2 = String(new java.lang.String(
                        android.util.Base64.decode(encoded, 0), "UTF-8"
                    ));
                    if (decoded2 && decoded2.trim().length > 0) return Response.success(decoded2);
                } catch (e2) {}
            }
        }
    }

    // Path 2: WebView render — JS đã decode vào #chapterContentDecoded
    if (!doc) doc = fetchBrowser(chapUrl, 15000);
    if (!doc) return Response.error("Không tải được nội dung chương");

    var contentEl = selFirst(doc, "#chapterContentDecoded");
    if (contentEl && contentEl.html().trim().length > 0) {
        contentEl.select("script, style, noscript, iframe, ins, button, a, .print-block-message").remove();
        var h = contentEl.html();
        // Fix no-copy-word: <span data-text="word"></span> → word
        h = h.replace(/<span[^>]*data-text="([^"]*)"[^>]*>\s*<\/span>/g, "$1");
        if (h && h.trim().length > 0) return Response.success(h);
    }

    // Fallback cuối: .entry-content.chapter-c
    var el = selFirst(doc, ".entry-content.chapter-c");
    if (!el) el = selFirst(doc, ".chapter-c");
    if (!el) el = selFirst(doc, ".entry-content");
    if (!el) return Response.error("Không tìm thấy nội dung chương");

    el.select("script, style, noscript, iframe, ins, button, a, .print-block-message, #chapterContentEncoded").remove();
    var html = el.html();
    if (!html || html.trim().length === 0) return Response.error("Nội dung chương trống");
    html = html.replace(/<span[^>]*data-text="([^"]*)"[^>]*>\s*<\/span>/g, "$1");
    return Response.success(html);
}
