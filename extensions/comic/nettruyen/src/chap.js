load("config.js");

// Ảnh chương đi qua proxy cùng host: /storage/?url=<encoded> (không có đuôi ảnh)
function isPageImage(src) {
    if (!src || src.indexOf("http") !== 0) return false;
    if (/logo|badge|icon|avatar|banner|advert|\/ads|pixel|dmca/i.test(src)) return false;
    if (src.indexOf("/storage/?url=") >= 0) return true;
    return /\.(jpg|jpeg|png|webp|gif|avif|bmp)(\?|#|$)/i.test(src);
}

function execute(url) {
    var chapUrl = (url.indexOf("http") === 0) ? url : BASE_URL + url;
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Không tải được chương");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung chương");

    var imgs = doc.select("div.chapter-images img");
    if (imgs.size() === 0) imgs = doc.select(".chapter-content img, #chapter-content img");
    if (imgs.size() === 0) imgs = doc.select("img[data-src]");

    var result = [];
    var seen = [];
    for (var i = 0; i < imgs.size(); i++) {
        var src = cleanImgSrc(imgs.get(i));
        if (!isPageImage(src)) continue;
        if (seen.indexOf(src) >= 0) continue;
        seen.push(src);
        result.push({ link: src });
    }

    if (result.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(result);
}
