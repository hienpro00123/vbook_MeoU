load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var body = "keyword=" + encodeURIComponent(key) + "&kwtype=0&fromtime=0000-00-00&totime=0000-00-00&minprice=0&maxprice=0";
    if (p > 1) body += "&page=" + p;
    var res = fetch(BASE_URL + "/search/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body
    });
    if (!res || !res.ok) return Response.error("Lỗi tìm kiếm");
    var doc = res.html();
    if (!doc) return Response.error("Lỗi tìm kiếm");
    var items = parseList(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
