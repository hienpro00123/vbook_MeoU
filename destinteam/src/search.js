load("config.js");

function execute(key, page) {
    var keyword = normalizeSpace(key);
    var currentPage = page ? parseInt(page, 10) : 1;
    if (!keyword) return Response.success([], null);

    var encoded = encodeURIComponent(keyword);
    var fetchUrl = BASE_URL + "/search/" + encoded + "/";
    if (currentPage > 1) fetchUrl = BASE_URL + "/search/" + encoded + "/page/" + currentPage + "/";

    var doc = fetchDoc(fetchUrl);
    if (!doc) return Response.error("Không tìm kiếm được truyện");

    var items = parseList(doc);
    var next = items.length > 0 ? getNextPage(doc, currentPage) : null;
    return Response.success(items, next);
}