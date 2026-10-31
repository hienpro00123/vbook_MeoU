load("config.js");

function escapeAttr(value) {
    return (value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function buildComicHtml(doc) {
    var imgs = doc.select(".chapter-content .manga-images-container img, .chapter-content img.manga-image");
    if (imgs.size() === 0) return "";

    var parts = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = img.attr("src") || img.attr("data-src") || "";
        if (!src) continue;
        if (src.indexOf("http") !== 0) src = STORAGE_URL + src;
        parts.push('<p><img src="' + escapeAttr(src) + '"/></p>');
    }

    return parts.join("");
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    var comicHtml = buildComicHtml(doc);
    if (comicHtml) {
        return Response.success(comicHtml);
    }

    var contentEl = selFirst(doc, ".chapter-content");
    if (!contentEl) return Response.error("Khong tim thay noi dung chuong");

    contentEl.select("script, style, noscript, iframe, .ads, .adsbygoogle, .manga-images-container").remove();

    var html = contentEl.html();
    if (!html || html.trim().length === 0) return Response.error("Chuong khong co noi dung");
    return Response.success(html);
}
