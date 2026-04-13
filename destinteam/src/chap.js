load("config.js");

function execute(url) {
    var chapterUrl = resolveUrl(url);
    var doc = fetchDoc(chapterUrl);
    if (!doc) return Response.error("Không tải được nội dung chương");

    var images = [];
    var seen = {};
    var imgNodes = doc.select("#chapter-content img");

    for (var i = 0; i < imgNodes.size(); i++) {
        var img = imgNodes.get(i);
        var imageUrl = img.attr("data-original-src") || img.attr("data-src") || img.attr("src") || "";
        imageUrl = resolveUrl(imageUrl);
        if (!imageUrl || imageUrl.indexOf("data:image/svg+xml") === 0 || seen[imageUrl]) continue;

        seen[imageUrl] = true;
        images.push({ link: imageUrl });
    }

    if (images.length === 0) {
        var html = doc.html ? doc.html() : "";
        var regex = /data-original-src=["']([^"']+)["']/gi;
        var match;
        while ((match = regex.exec(html)) !== null) {
            var fallbackUrl = resolveUrl(match[1]);
            if (!fallbackUrl || seen[fallbackUrl]) continue;
            seen[fallbackUrl] = true;
            images.push({ link: fallbackUrl });
        }
    }

    if (images.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(images);
}