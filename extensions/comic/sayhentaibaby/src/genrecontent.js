load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    // URL dạng: https://sayhentai.baby/the-loai/ntr?order_by=update_time&sort=desc
    var baseUrl = (url || "").split("&page=")[0];
    var pageUrl = baseUrl + "&page=" + p;

    var res = fetchRetry(pageUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc trang " + p);
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    var items = parseList(doc);

    // Pagination: a[href*='page=N'] trong ul.pagination
    var nextEl = selFirst(doc, "ul.pagination a[href*='page=" + (p + 1) + "']");

    return Response.success(items, nextEl !== null ? p + 1 : -1);
}
