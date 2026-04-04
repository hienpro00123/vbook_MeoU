load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res.ok) return Response.error("Lỗi tải mục lục");
    var doc = res.html();
    if (!doc) return Response.error("Lỗi tải mục lục");

    // Trích path từ URL để filter chapter links chính xác
    // storyUrl = "https://m.bixiange.me/wxxz/20921"
    // storyPath = "/wxxz/20921"
    var storyPath = storyUrl.replace(BASE_URL, "").replace(/\.html$/, "");

    var chapters = [];
    var seen = {};

    // Chapter links pattern: /{category}/{id}/index/{n}.html
    // Dùng selector chứa storyPath để tránh match link nav không liên quan
    var chapLinks = doc.select("a[href*='" + storyPath + "/index/']");
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href") || "";
        // Chuẩn hóa thành absolute URL
        if (href && href.indexOf("http") !== 0) href = BASE_URL + href;
        if (seen[href]) continue;
        seen[href] = true;
        var chapName = a.text().trim();
        if (!chapName) chapName = a.attr("title") || "";
        // Bỏ qua nút "在线阅读" (text hiển thị, cùng URL với chương 1)
        if (!chapName || chapName === "\u5728\u7ebf\u9605\u8bfb") continue;
        chapters.push({ name: chapName, url: href, host: HOST });
    }

    return Response.success(chapters);
}
