load("config.js");

var API_ROUTES = {
    "truyen": "",
    "moi-cap-nhat": "orderby=modified&order=desc",
    "danh-sach-a-z": "orderby=title&order=asc"
};

function fetchTrending(page) {
    var currentPage = page || 1;
    if (currentPage > 1) return { items: [], next: null };
    var ranking = fetchJson(BASE_URL + "/wp-json/initmanga/v1/top-ranking?range=week");
    if (!ranking || !ranking.posts || ranking.posts.length === 0) return { items: [], next: null };
    var ids = [];
    for (var i = 0; i < ranking.posts.length; i++) ids.push(ranking.posts[i].id);
    return fetchMangaApi("include=" + ids.join(",") + "&orderby=include", 1);
}

function execute(url, page) {
    var currentPage = page ? parseInt(page, 10) : 1;

    if (url === "dang-thinh-hanh") {
        var trending = fetchTrending(currentPage);
        if (trending.items.length === 0 && currentPage === 1) return Response.error("Không tải được danh sách truyện");
        return Response.success(trending.items, trending.next);
    }

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