load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var baseUrl = (url || "").split("&page=")[0].split("?page=")[0];
    var pageUrl = baseUrl + "&page=" + p;

    var res = fetchRetry(pageUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc trang " + p);
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    var items = parseList(doc);

    var nextEl = selFirst(doc, "ul.pagination a[href*='page=" + (p + 1) + "']");
    var hasNext = nextEl !== null;

    return Response.success(items, hasNext ? p + 1 : -1);
}
