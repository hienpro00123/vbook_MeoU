load("config.js");

function execute(url) {
    // App strips trailing slash — add it back for WordPress
    var chapUrl = url.replace(/\/?$/, "/");

    var res = fetchPage(chapUrl);
    if (!res || !res.ok) return Response.error("HTTP " + (res ? res.status : 0));
    var doc = res.html();

    var title = doc.select(".mhcv-reader-head h1").text();
    var content = doc.select(".mhcv-reader-content").html();

    if (!content) return Response.error("Không tìm thấy nội dung chương");

    return Response.success(content, title);
}
