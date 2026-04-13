load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    var imgs = doc.select(".chapter-content .manga-images-container img, .chapter-content img.manga-image");
    if (imgs.size() === 0) {
        var contentEl = selFirst(doc, ".chapter-content");
        if (!contentEl) return Response.error("Khong tim thay noi dung chuong");
        return Response.success(contentEl.html());
    }

    var data = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = img.attr("src") || img.attr("data-src") || "";
        if (!src) continue;
        if (src.indexOf("http") !== 0) src = STORAGE_URL + src;
        data.push({ link: src });
    }

    if (data.length === 0) return Response.error("Khong co anh trong chuong");
    return Response.success(data);
}
