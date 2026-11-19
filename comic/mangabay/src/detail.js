load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    var doc = mangaBayDocument(url);

    var title = doc.select("h1").text();
    var cover = "";
    doc.select("img").forEach(function (img) {
        if (!cover && img.attr("alt").indexOf("Poster for the manga") !== -1) {
            cover = mangaBayImage(img);
        }
    });
    if (!cover) cover = mangaBayImage(doc.select("main img").first());

    var description = doc.select("meta[name=description]").attr("content");
    if (!description) description = doc.select("main article p").text();

    var tags = [];
    var seenTags = [];
    doc.select("main dl a[href*='/ComicList/g=']").forEach(function (link) {
        var name = link.text();
        var tagUrl = normalizeUrl(link.attr("href"));
        if (name && tagUrl && seenTags.indexOf(tagUrl) === -1) {
            seenTags.push(tagUrl);
            tags.push({ title: name, input: tagUrl, script: "search.js" });
        }
    });

    var summary = doc.select("dl").text().toLowerCase();
    return Response.success({
        name: title,
        author: "",
        cover: cover ? normalizeUrl(cover) : "",
        description: description,
        detail: "",
        url: url,
        type: "comic",
        format: "comic",
        ongoing: summary.indexOf("completed") === -1,
        tags: tags,
        genres: tags
    });
}
