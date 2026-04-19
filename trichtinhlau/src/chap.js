load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var doc = null;
    var res = fetchRetry(chapUrl);
    if (res && res.ok) doc = res.html();
    if (!doc) doc = fetchBrowser(chapUrl, 15000);
    if (!doc) return Response.error("Không tải được nội dung chương");

    // Nội dung được base64 encode trong data-encoded attribute
    var encEl = selFirst(doc, "#chapterContentEncoded");
    if (encEl) {
        var encoded = encEl.attr("data-encoded");
        if (encoded && encoded.length > 0) {
            var bytes = android.util.Base64.decode(encoded, android.util.Base64.DEFAULT);
            var decoded = new java.lang.String(bytes, "UTF-8");
            if (decoded && decoded.trim().length > 0) return Response.success(decoded);
        }
    }

    // Fallback: lấy HTML trực tiếp (khi browser render xong JS)
    var el = selFirst(doc, ".entry-content.chapter-c");
    if (!el) el = selFirst(doc, ".chapter-c");
    if (!el) el = selFirst(doc, ".entry-content");
    if (!el) return Response.error("Không tìm thấy nội dung chương");

    el.select("script, style, noscript, iframe, ins, button, a, .print-block-message, #chapterContentEncoded").remove();
    var html = el.html();
    if (!html || html.trim().length === 0) return Response.error("Nội dung chương trống");
    return Response.success(html);
}
