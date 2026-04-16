load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    // div.contentimg > div.imageload > img.simg[src]
    var imgs = doc.select("div.contentimg img.simg");
    if (imgs.size() === 0) {
        // fallback: all img trong contentimg
        imgs = doc.select("div.contentimg img");
    }
    if (imgs.size() === 0) return Response.error("Khong co anh trong chuong");

    var data = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        // src trực tiếp, data-sv1 là backup cùng CDN
        var src = img.attr("src") || img.attr("data-sv1") || "";
        if (!src || src.indexOf("data:image") === 0) continue;
        data.push({ link: src });
    }

    if (data.length === 0) return Response.error("Khong co anh hop le trong chuong");
    return Response.success(data);
}
