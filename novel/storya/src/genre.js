load("config.js");

function execute() {
    var doc = fetchPage(SITE_PREFIX + "/genres");
    if (!doc) return Response.error("Không tải được danh sách thể loại");
    var links = doc.select('a[href*="/vi/genres/"]');
    var r = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var link = links.get(i);
        var href = link.attr("href");
        var match = /^\/vi\/genres\/([^\/?#]+)$/.exec(href);
        if (!match || seen[match[1]]) continue;
        seen[match[1]] = true;
        var title = link.text().replace(/\d[\d.,]*\s*(truyện|stories)$/i, "").trim();
        if (title) r.push({ title: title, input: match[1], script: "genrecontent.js" });
    }
    return Response.success(r);
}
