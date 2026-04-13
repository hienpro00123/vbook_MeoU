load("config.js");

function execute(key, page) {
    var keyword = normalizeSpace(key);
    var currentPage = page ? parseInt(page, 10) : 1;
    if (!keyword) return Response.success([], null);

    var result = fetchMangaApi("search=" + encodeURIComponent(keyword), currentPage);
    return Response.success(result.items, result.next);
}