load("config.js");

function execute(url, page) {
    var p = parseInt(page) || 1;
    var slug = url.replace(/^.*\/vi\/genres\//, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    var path = SITE_PREFIX + "/genres/" + slug + "?page=" + p;
    var doc = fetchPage(path);
    if (!doc) return Response.error("Không tải được danh sách truyện");
    return Response.success(parseStories(doc), getNextPage(doc));
}
