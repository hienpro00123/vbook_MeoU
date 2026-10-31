load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Không tải được chương");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung chương");

    // Ảnh chương nằm trong .page-break img — CDN cdn.hentaicube.xyz
    var imgs = doc.select(".page-break img[src], .reading-content img[src]");
    if (imgs.size() === 0) return Response.error("Không có ảnh trong chương");

    var data = [];
    for (var i = 0; i < imgs.size(); i++) {
        var src = imgs.get(i).attr("src") || "";
        if (!src || src.indexOf("http") !== 0) continue;
        data.push({ link: src });
    }

    if (data.length === 0) return Response.error("Không có ảnh trong chương");
    return Response.success(data);
}
