load("config.js");

function execute(url) {
    var chapUrl = url.indexOf("http") === 0 ? url : resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    var imgs = doc.select("div.contentimg img.simg");
    if (imgs.size() === 0) {
        imgs = doc.select("div.contentimg img");
    }
    if (imgs.size() === 0) return Response.error("Khong co anh trong chuong");

    var data = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        // sv2 = i0.wp.com proxy (IPv4, on dinhh) - uu tien sv2 tranh loi IPv6 CDN
        var sv2 = img.attr("data-sv2") || "";
        var sv1 = img.attr("src") || img.attr("data-sv1") || "";
        var sv3 = img.attr("data-sv3") || "";
        var src = sv2 || sv1 || sv3;
        if (!src || src.indexOf("data:image") === 0) continue;
        data.push({ link: src });
    }

    if (data.length === 0) return Response.error("Khong co anh hop le trong chuong");
    return Response.success(data);
}
