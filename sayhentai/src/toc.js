load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Khong tai duoc danh sach chuong");

    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc danh sach chuong");

    var links = doc.select("ul.box-list-chapter li a[href], .listing-chapters_wrap li a[href], .listing-chapters_wrap a[href]");
    var items = [];
    var seen = {};
    for (var i = links.size() - 1; i >= 0; i--) {
        var a = links.get(i);
        var chapterUrl = resolveUrl(a.attr("href") || "");
        var name = normalizeSpace(a.text());
        if (!chapterUrl || !name || seen[chapterUrl]) continue;
        seen[chapterUrl] = true;
        items.push({
            name: name,
            url: chapterUrl,
            host: HOST
        });
    }

    if (items.length === 0) return Response.error("Khong tim thay chuong nao");
    return Response.success(items);
}