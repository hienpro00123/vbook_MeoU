load("config.js");

function isNovelUrl(url) {
    var slug = extractSlug(url);
    return slug.indexOf("novel-") === 0 || slug.indexOf("full-novel-") === 0;
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    if (isNovelUrl(url)) {
        var contentEl = selFirst(doc, ".chapter-content");
        if (!contentEl) return Response.error("Khong tim thay noi dung chuong");
        contentEl.select("script, style, noscript, iframe, .ads, .adsbygoogle").remove();
        var html = contentEl.html();
        if (!html || html.trim().length === 0) return Response.error("Chuong khong co noi dung");
        return Response.success(html);
    }

    var imgs = doc.select(".chapter-content .manga-images-container img, .chapter-content img.manga-image");
    if (imgs.size() === 0) return Response.error("Khong co anh trong chuong");

    var htmlParts = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = img.attr("src") || img.attr("data-src") || "";
        if (!src) continue;
        if (src.indexOf("http") !== 0) src = STORAGE_URL + src;
        htmlParts.push('<img src="' + src + '" style="width:100%;display:block">');
    }

    if (htmlParts.length === 0) return Response.error("Khong co anh trong chuong");
    return Response.success(htmlParts.join(""));
}
