load("config.js");

function execute(url, page) {
    var currentPage = page ? parseInt(page, 10) : 1;
    var fetchUrl = BASE_URL + "/" + url + "/";
    if (currentPage > 1) fetchUrl = BASE_URL + "/" + url + "/page/" + currentPage + "/";

    var doc = fetchDoc(fetchUrl);
    if (!doc) return Response.error("Không tải được danh sách truyện");

    var items = parseList(doc);
    var next = items.length > 0 ? getNextPage(doc, currentPage) : null;
    return Response.success(items, next);
}