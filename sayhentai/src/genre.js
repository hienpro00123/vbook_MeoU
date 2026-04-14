load("config.js");

function execute() {
    var res = fetchRetry(BASE_URL + "/genre");
    if (!res || !res.ok) return Response.success([]);

    var doc = res.html();
    if (!doc) return Response.success([]);

    var links = doc.select("a[href*='/genre/']");
    return Response.success(collectGenreEntries(links));
}