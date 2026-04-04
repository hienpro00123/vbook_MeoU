load("config.js");

function execute(url) {
    // Lấy truyện đề xuất từ cùng thể loại với bộ truyện đang xem
    var m = /\/(dsyq|wxxz|xhqh|cyjk|khjj|ghxy|jsls|guanchang|xtfq|dmtr|trxs|jqxs)\//.exec(url);
    if (!m) return Response.success([]);
    var category = m[1];
    var fetchUrl = paginateUrl(category, 1);
    var res = fetchRetry(fetchUrl);
    if (!res.ok) return Response.success([]);
    var doc = res.html();
    if (!doc) return Response.success([]);
    var items = parseList(doc);
    return Response.success(items || []);
}
