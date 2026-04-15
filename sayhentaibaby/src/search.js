load("config.js");

function execute(input) {
    var keyword = input.input || "";
    var page = input.page || 1;
    var encoded = encodeURIComponent(keyword);
    var searchUrl = BASE_URL + "/search?q=" + encoded + "&page=" + page;

    var res = fetchRetry(searchUrl);
    if (!res || !res.ok) return Response.error("Khong tim kiem duoc");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc ket qua");

    var items = parseList(doc);
    if (items.length === 0 && page === 1) return Response.error("Khong co ket qua cho: " + keyword);

    var nextEl = selFirst(doc, "ul.pagination a[href*='page=" + (page + 1) + "']");
    var hasNext = nextEl !== null;

    return Response.success(items, hasNext ? page + 1 : -1);
}
