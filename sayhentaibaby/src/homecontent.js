load("config.js");

function execute(input) {
    var url = input.input;
    var page = input.page || 1;
    var baseUrl = url.split("&page=")[0].split("?page=")[0];
    var pageUrl = baseUrl + (baseUrl.indexOf("?") >= 0 ? "&" : "?") + "page=" + page;

    var res = fetchRetry(pageUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc trang " + page);
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    var items = parseList(doc);

    // Kiểm tra trang tiếp
    var nextEl = selFirst(doc, "ul.pagination a[href*='page=" + (page + 1) + "']");
    var hasNext = nextEl !== null;

    return Response.success(items, hasNext ? page + 1 : -1);
}
