load("config.js");

function execute(url) {
    var chapUrl = resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    var contentEl = selFirst(doc, ".chapter-content");
    if (!contentEl) return Response.error("Khong tim thay noi dung chuong");

    contentEl.select("script, style, noscript, iframe, img, table, .ads, .adsbygoogle").remove();

    var ps = contentEl.select("p");
    if (ps.size() === 0) {
        var raw = contentEl.text().trim();
        if (!raw) return Response.error("Chuong khong co noi dung");
        return Response.success(raw);
    }

    var parts = [];
    for (var i = 0; i < ps.size(); i++) {
        var t = ps.get(i).text().trim();
        if (t && t !== "\u00a0") parts.push(t);
    }
    if (parts.length === 0) return Response.error("Chuong khong co noi dung");
    return Response.success("<p>" + parts.join("</p><p>") + "</p>");
}
