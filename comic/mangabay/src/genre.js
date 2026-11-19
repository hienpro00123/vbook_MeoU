load('config.js');
function execute() {
    var doc = mangaBayDocument(BASE_URL + "/");
    var genres = [];
    var seen = [];

    doc.select("a[href*='/ComicList/g=']").forEach(function (link) {
        var input = normalizeUrl(link.attr("href"));
        var title = link.text();
        if (input && title && seen.indexOf(input) === -1) {
            seen.push(input);
            genres.push({ title: title, input: input, script: "search.js" });
        }
    });
    return Response.success(genres);
}
