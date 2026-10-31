load("config.js");

function execute(key, page) {
    var keyword = normalizeSpace(key);
    if (!keyword) return Response.success([], null);

    var currentPage = page ? parseInt(page, 10) : 1;
    if (!(currentPage > 0)) currentPage = 1;

    var searchUrl = BASE_URL + "/search?s=" + encodeURIComponent(keyword);
    var res = fetchRetry(buildPagedUrl(searchUrl, currentPage));
    if (!res || !res.ok) return Response.error("Khong tai duoc ket qua tim kiem");

    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc ket qua tim kiem");

    var items = parseListItems(doc);
    var next = getNextPage(doc, currentPage);
    return Response.success(items, next);
}