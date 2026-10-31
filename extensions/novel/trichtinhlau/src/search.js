load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/timkiem?s=" + encodeURIComponent(key) + "&page=" + p;
    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.error("Không tải được kết quả tìm kiếm");
    var doc = res.html();
    if (!doc) return Response.success([], null);
    var items = parseCards(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
