load("config.js");

var GENRE_SLUG_RE = /\/the-loai\/([^\/?#]+)/;

function execute() {
    var res = fetchRetry(BASE_URL);
    if (!res || !res.ok) return Response.success([]);
    var doc = res.html();
    if (!doc) return Response.success([]);

    var links = doc.select("a[href*='/the-loai/']");
    var genres = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        var m = GENRE_SLUG_RE.exec(href);
        if (!m) continue;
        var slug = m[1];
        if (seen[slug]) continue;
        seen[slug] = true;
        var name = a.text().trim().replace(/^[»›]\s*/, "");
        if (!name) continue;
        genres.push({ title: name, input: slug, script: "genrecontent.js" });
    }
    return Response.success(genres);
}
