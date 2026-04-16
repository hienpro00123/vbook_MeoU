load("config.js");

function execute(url) {
    var detailUrl = resolveUrl(url);
    var res = fetchRetry(detailUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc danh sach chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    // ul#list-chap > li.chapter > a[href]
    var chapLinks = doc.select("ul#list-chap li.chapter a[href]");
    if (chapLinks.size() === 0) return Response.error("Khong co chuong nao");

    var chapters = [];
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href");
        if (!href || href.indexOf("/doc-truyen/") < 0) continue;
        var title = (a.attr("title") || "").trim();
        if (!title) {
            var chapName = selFirst(a, "span.chap-name");
            title = chapName ? chapName.text().trim() : "";
        }
        var chapUrl = href.indexOf("http") === 0 ? href : resolveUrl(href);
        chapters.push({ name: title, url: chapUrl, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Khong co chuong hop le");

    // Moi nhat truoc → dao nguoc
    chapters.reverse();
    return Response.success(chapters);
}
