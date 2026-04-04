load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var fetchUrl = BASE_URL + "/tim-kiem?keyword=" + encodeURIComponent(key) + "&page=" + p;
    // HTTP-first: fetchSmart thử HTTP trước (nhiều server SSR trả kết quả ngay)
    // Chỉ fallback browser khi HTML < 3000 bytes (trang cần JS render)
    var doc = fetchSmart(fetchUrl);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm");
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
