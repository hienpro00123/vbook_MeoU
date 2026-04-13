load("config.js");

function execute(url) {
    var detailUrl = resolveUrl(url);
    var doc = fetchDoc(detailUrl);
    if (!doc) return Response.error("Không tải được thông tin truyện");

    var nameEl = selFirst(doc, "h1");
    var name = nameEl ? normalizeSpace(nameEl.text()) : "";
    var cover = getCoverFromDoc(doc);

    var descEl = selFirst(doc, "#manga-description");
    var description = descEl ? stripHtml(descEl.html()) : "";

    var authorEl = selFirst(doc, "a[href*='/nhom/'], a[href*='/team/'], a[href*='/tac-gia/'], a[href*='/author_tax/']");
    var author = authorEl ? normalizeSpace(authorEl.text()) : "";

    var genres = [];
    var seen = {};
    var genreLinks = doc.select("a[href*='/the-loai/']");
    for (var i = 0; i < genreLinks.size(); i++) {
        var genre = genreLinks.get(i);
        var genreName = normalizeSpace(genre.text());
        var href = resolveUrl(genre.attr("href") || "");
        var match = href.match(/\/the-loai\/([^\/?#]+)\/?$/i);
        if (!genreName || !match || seen[match[1]]) continue;

        seen[match[1]] = true;
        genres.push({ name: genreName, input: match[1], script: "genrecontent.js" });
    }

    var suggests = [];
    var parsed = parseList(doc);
    var currentRelative = toRelativeUrl(detailUrl);
    for (var j = 0; j < parsed.length; j++) {
        if (parsed[j].link === currentRelative) continue;
        suggests.push(parsed[j]);
        if (suggests.length >= 12) break;
    }

    var allText = normalizeSpace(doc.text ? doc.text() : "");
    var ongoing = /Đang tiến hành/i.test(allText);
    if (/Hoàn thành|Trọn bộ/i.test(allText)) ongoing = false;

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: "",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}