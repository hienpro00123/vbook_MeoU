load("config.js");

function execute(url) {
    var chapUrl = (url.indexOf("http") === 0) ? url : BASE_URL + url;
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Không tải được chương");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung chương");

    var imgs = doc.select(".page-chapter img");
    if (imgs.size() === 0) return Response.error("Không tìm thấy ảnh chương");

    var result = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
        if (!src || src.indexOf("data:") === 0) continue;
        // Bỏ qua ảnh assets/thông báo
        if (src.indexOf("/assets/") >= 0) continue;
        result.push({ link: src });
    }

    if (result.length === 0) return Response.error("Không tìm thấy ảnh chương");
    return Response.success(result);
}
