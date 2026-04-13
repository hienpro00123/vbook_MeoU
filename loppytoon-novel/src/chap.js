load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    var contentEl = selFirst(doc, ".chapter-content");
    if (!contentEl) return Response.error("Khong tim thay noi dung chuong");

    contentEl.select("script, style, noscript, iframe").remove();
    return Response.success(contentEl.html());
}
