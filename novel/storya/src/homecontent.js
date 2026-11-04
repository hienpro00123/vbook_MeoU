load("config.js");

function execute(url, page) {
    var p = parseInt(page) || 1;
    var path = url || SITE_PREFIX + "/stories";
    path = path.split("#")[0].replace(/([?&])page=\d+/g, "");
    path += (path.indexOf("?") >= 0 ? "&" : "?") + "page=" + p;
    var doc = fetchPage(path);
    if (!doc) return Response.error("Không tải được danh sách truyện");
    return Response.success(parseStories(doc), getNextPage(doc));
}
