load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được mục lục");
    var doc = res.html();
    if (!doc) return Response.error("Không tải được mục lục");

    var chapters = [];
    var seen = {};

    var chapLinks = doc.select("a[href*='/doc-truyen/']");
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href");
        if (!href || seen[href]) continue;
        seen[href] = true;
        var name = a.text().trim();
        if (!name) continue;
        var fullUrl = href.indexOf("http") === 0 ? href : BASE_URL + href;
        chapters.push({ name: name, url: fullUrl, host: HOST });
    }

    return Response.success(chapters);
}
