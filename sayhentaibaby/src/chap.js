load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    var imgs = doc.select("div.contentimg img.simg");
    if (imgs.size() === 0) return Response.error("Khong co anh trong chuong");

    var data = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = img.attr("src") || img.attr("data-sv1") || img.attr("data-src") || "";
        if (!src) continue;
        data.push({ link: src });
    }

    if (data.length === 0) return Response.error("Khong co anh trong chuong");
    return Response.success(data);
}
