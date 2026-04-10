load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được trang truyện");

    var chapters = [];
    var seen = {};
    var links = doc.select(".chapter-list_kuro li a[href]");
    if (links.size() === 0) links = doc.select(".section_kuro li a[href]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || seen[href]) continue;
        seen[href] = true;
        var name = a.ownText().trim();
        if (!name) name = a.text().trim();
        if (!name) continue;
        chapters.push({ name: name, url: href, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương");
    return Response.success(chapters);
}
