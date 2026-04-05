load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/tim-kiem?keyword=" + encodeURIComponent(key) + "&page=" + p;
    // Tìm kiếm trả SSR — dùng fetchRetry nhanh hơn fetchSmart (bỏ double request)
    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.error("Không tải được kết quả tìm kiếm");
    var doc = res.html();
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm");
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
