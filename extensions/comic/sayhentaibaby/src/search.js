load("config.js");

function execute(keyword, page) {
    var p = page ? parseInt(page) : 1;
    var encoded = encodeURIComponent(keyword || "");
    var searchUrl = BASE_URL + "/search?q=" + encoded + "&page=" + p;

    var res = fetchRetry(searchUrl);
    if (!res || !res.ok) return Response.error("Khong tim kiem duoc");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc ket qua");

    var items = parseList(doc);
    if (items.length === 0 && p === 1) return Response.error("Khong co ket qua cho: " + keyword);

    var nextEl = selFirst(doc, "ul.pagination a[href*='page=" + (p + 1) + "']");
    var hasNext = nextEl !== null;

    return Response.success(items, hasNext ? p + 1 : -1);
}
