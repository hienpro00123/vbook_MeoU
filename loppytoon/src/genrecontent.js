load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var res = fetchRetry(BASE_URL + "/the-loai/" + url + "?page=" + p);
    if (!res || !res.ok) return Response.success([], null);
    var doc = res.html();
    if (!doc) return Response.success([], null);
    return Response.success(parseCards(doc), getNextPage(doc, p));
}
