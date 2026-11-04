load("config.js");

function execute(key, page) {
    key = key || "";
    var doc = fetchPage(SITE_PREFIX + "/search?q=" + encodeURIComponent(key));
    if (!doc) return Response.error("Không thể tìm kiếm trên Storya");
    return Response.success(parseStories(doc), getNextPage(doc));
}
