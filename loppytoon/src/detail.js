load("config.js");

var AUTHOR_RE = /\/tac-gia\?name=([^&]+)/;
var GENRE_RE = /\/the-loai\/([^\/?#]+)/;

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc trang truyen");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung trang");

    var titleEl = selFirst(doc, "h1.manga-title, h1");
    var coverEl = selFirst(doc, ".manga-cover .cover-image, .manga-cover img");
    var authorEl = selFirst(doc, "a[href*='/tac-gia']");
    var descEl = selFirst(doc, ".manga-description");

    var name = titleEl ? titleEl.text().trim() : "";
    var cover = coverEl ? resolveCover(coverEl.attr("src") || "") : "";
    var author = authorEl ? authorEl.text().trim() : "";

    var genres = [];
    var infoEl = selFirst(doc, ".manga-info");
    if (infoEl) {
        var genreLinks = infoEl.select("a[href*='/the-loai/']");
        for (var gi = 0; gi < genreLinks.size() && gi < 5; gi++) {
            var gEl = genreLinks.get(gi);
            var gName = gEl.text().trim();
            var gHref = gEl.attr("href") || "";
            var gMatch = GENRE_RE.exec(gHref);
            if (gMatch && gName) {
                genres.push({ title: gName, input: gMatch[1], script: "genrecontent.js" });
            }
        }
    }

    var descParts = [];
    if (descEl) {
        var ps = descEl.select("p");
        for (var pi = 0; pi < ps.size(); pi++) {
            var part = ps.get(pi).text().trim();
            if (part) descParts.push(part);
        }
        if (descParts.length === 0) {
            var fallback = descEl.text().trim();
            if (fallback) descParts.push(fallback);
        }
    }

    var status = "";
    var altName = "";
    var metaLabels = doc.select(".meta-label");
    for (var mi = 0; mi < metaLabels.size(); mi++) {
        var label = metaLabels.get(mi).text().trim();
        var valueEl = metaLabels.get(mi).nextElementSibling();
        var value = valueEl ? valueEl.text().trim() : "";
        if (label.indexOf("Tình trạng") >= 0) status = value;
        if (label.indexOf("Tên khác") >= 0) altName = value;
    }

    var ongoing = true;
    if (status) {
        var ls = status.toLowerCase();
        ongoing = ls.indexOf("complete") === -1 && ls.indexOf("hoan") === -1 && ls.indexOf("hoàn") === -1;
    }

    var detailParts = [];
    if (status) detailParts.push("Tinh trang: " + status);
    if (altName) detailParts.push("Ten khac: " + altName);
    detailParts.push("Noi dung: 18+");

    var suggests = [];
    if (authorEl) {
        var authorHref = authorEl.attr("href") || "";
        var authorMatch = AUTHOR_RE.exec(authorHref);
        if (authorMatch) {
            suggests.push({ title: "Cung tac gia: " + author, input: "author:" + authorMatch[1], script: "suggest.js" });
        }
    }

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: descParts.join("\n"),
        detail: detailParts.join("\n"),
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        comments: []
    });
}
