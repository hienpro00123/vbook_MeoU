load("config.js");

function execute(url) {
    var slug = extractSlug(url);
    var doc = fetchPage(SITE_PREFIX + "/stories/" + slug);
    if (!doc) return Response.error("Không tải được thông tin truyện");

    var name = doc.select("main h1").text();
    if (!name) return Response.error("Không đọc được tên truyện Storya");
    var metaDescription = doc.select('meta[name="description"]').attr("content") || "";
    var cover = doc.select('meta[property="og:image"]').attr("content");
    var genres = [];
    var genreLinks = doc.select('a[href*="/vi/genres/"]');
    for (var i = 0; i < genreLinks.size(); i++) {
        var genreLink = genreLinks.get(i);
        var genreMatch = /^\/vi\/genres\/([^\/?#]+)$/.exec(genreLink.attr("href"));
        if (genreMatch) genres.push({
            title: genreLink.text(),
            input: genreMatch[1],
            script: "genrecontent.js"
        });
    }

    var author = "";
    var authorMatch = /tác giả\s+([^,.]+)/i.exec(metaDescription);
    if (authorMatch) author = authorMatch[1].trim();

    return Response.success({
        name: name,
        url: resolveUrl(SITE_PREFIX + "/stories/" + slug),
        host: HOST,
        cover: cover ? resolveUrl(cover) : "",
        author: author,
        description: metaDescription,
        genres: genres,
        ongoing: doc.select("main").text().indexOf("Đang cập nhật") >= 0
    });
}
