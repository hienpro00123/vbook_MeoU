load("config.js");

function execute(input, page) {
    if (input.indexOf("author:") !== 0) return Response.success([], null);
    var p = page ? parseInt(page) : 1;
    var authorName = decodeURIComponent(input.substring(7));
    var res = fetchRetry(BASE_URL + "/tac-gia?name=" + encodeURIComponent(authorName) + "&page=" + p);
    if (!res || !res.ok) return Response.success([], null);
    var doc = res.html();
    if (!doc) return Response.success([], null);
    return Response.success(parseCards(doc), getNextPage(doc, p));
}
