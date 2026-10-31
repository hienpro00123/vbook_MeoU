load("config.js");

var AUTHOR_RE = /\u4f5c\u8005[\uff1a:]\s*(.+)/;

function execute(url) {
    var bookUrl = resolveUrl(url);
    var doc = fetchBrowser(bookUrl, 8000);
    if (!doc) return Response.error("无法加载书籍详情");

    // Title
    var nameEl = selFirst(doc, ".book h1, h1");
    var name = nameEl ? nameEl.text().trim() : "";
    if (!name) {
        var titleTag = selFirst(doc, "title");
        if (titleTag) name = titleTag.text().trim().replace(/[-_\|].*$/, "").trim();
    }

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".book .cover img, .book .left img, .bookimg img");
    if (coverEl) cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
    if (!cover) {
        var metaOg = selFirst(doc, "meta[property='og:image']");
        if (metaOg) cover = metaOg.attr("content") || "";
    }
    if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;

    // Author
    var author = "";
    var authorLink = selFirst(doc, ".book h2 a, .book .author a, a[href*='/author/']");
    if (authorLink) author = authorLink.text().trim();
    if (!author) {
        var h2 = selFirst(doc, ".book h2, .book .status");
        if (h2) {
            var am = AUTHOR_RE.exec(h2.text().trim());
            if (am) author = am[1].trim();
        }
    }

    // Description
    var descEl = selFirst(doc, ".book .intro, .intro, #intro");
    var description = descEl ? stripHtml(descEl.html()) : "";

    // Genres
    var genres = [];
    var tagLinks = doc.select(".book-tag a, .book .tag a");
    for (var gi = 0; gi < tagLinks.size(); gi++) {
        var tag = tagLinks.get(gi);
        var tagName = tag.text().trim();
        var tagHref = tag.attr("href") || "";
        if (tagName && tagHref.indexOf("/sort/") !== -1) {
            var input = tagHref.replace(/.*\/sort\//, "").replace(/\/$/, "");
            if (input) {
                genres.push({ name: tagName, input: input, script: "genrecontent.js" });
            }
        }
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        genres: genres
    });
}
