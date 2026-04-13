load("config.js");

var API_ROUTES = {
    "truyen": "",
    "moi-cap-nhat": "orderby=modified&order=desc"
};

function execute(url, page) {
    var currentPage = page ? parseInt(page, 10) : 1;

    if (API_ROUTES[url] !== undefined) {
        var result = fetchMangaApi(API_ROUTES[url], currentPage);
        if (result.items.length === 0 && currentPage === 1) return Response.error("Không tải được danh sách truyện");
        return Response.success(result.items, result.next);
    }

    var fetchUrl = BASE_URL + "/" + url + "/";
    if (currentPage > 1) fetchUrl = BASE_URL + "/" + url + "/page/" + currentPage + "/";

    var doc = fetchDoc(fetchUrl);
    if (!doc) return Response.error("Không tải được danh sách truyện");

    var items = parseList(doc);
    var next = items.length > 0 ? getNextPage(doc, currentPage) : null;
    return Response.success(items, next);
}