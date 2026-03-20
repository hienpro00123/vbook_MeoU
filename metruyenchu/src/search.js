load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/tim-kiem?keyword=" + encodeURIComponent(key) + "&page=" + p;
    // Trang tìm kiếm render bằng JS — dùng fetchBrowser để lấy kết quả đúng
    var doc = fetchBrowser(fetchUrl);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm");
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
