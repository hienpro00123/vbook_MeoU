load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var doc = fetchBrowser(storyUrl, 7000);
    if (!doc) return Response.error("Lỗi tải mục lục");

    // Trích path từ URL để filter chapter links chính xác
    // storyUrl = "https://m.bixiange.me/wxxz/20921"
    // storyPath = "/wxxz/20921"
    var storyPath = storyUrl.replace(BASE_URL, "").replace(/\.html$/, "");

    var chapters = [];
    var seen = {};

    // Chapter links pattern: /{category}/{id}/index/{n}.html
    // Dùng selector chứa storyPath để tránh match link nav không liên quan
    // Cũng thu thập link chương 1 nếu dùng URL dạng /storyPath/ (không có /index/)
    var chapLinks = doc.select("a[href*='" + storyPath + "/index/'], a[href='" + storyPath + "/']");
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href") || "";
        // Chuẩn hóa thành absolute URL
        if (href && href.indexOf("http") !== 0) href = BASE_URL + href;
        if (seen[href]) continue;
        var chapName = a.text().trim();
        if (!chapName) chapName = a.attr("title") || "";
        // Bỏ qua nút "在线阅读" — nhưng KHÔNG mark seen để link thật cùng URL vẫn được xử lý
        if (!chapName || chapName === "\u5728\u7ebf\u9605\u8bfb") continue;
        seen[href] = true;  // mark sau khi xác nhận tên hợp lệ
        chapters.push({ name: chapName, url: href, host: HOST });
    }

    return Response.success(chapters);
}
