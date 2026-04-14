load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");

    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    var imgs = doc.select("#chapter_content img[id^=image], #chapter_content img, .chapter-content img, .reading-content img");
    if (imgs.size() === 0) return Response.error("Khong tim thay anh chuong");

    var data = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = resolveImageUrl(img.attr("data-src") || img.attr("data-original") || img.attr("src") || "");
        if (!src) continue;
        data.push({ link: src });
    }

    if (data.length === 0) return Response.error("Khong tim thay anh chuong");
    return Response.success(data);
}