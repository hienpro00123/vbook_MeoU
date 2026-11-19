load('config.js');
function execute(query, page) {
    query = query || "";
    page = page || "1";

    var url;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        url = mangaBayPageUrl(query, page);
    } else if (query) {
        url = mangaBayPageUrl("/search/" + encodeURIComponent(query), page);
    } else {
        url = mangaBayPageUrl("/comix/", page);
    }

    var doc = mangaBayDocument(url);
    var items = mangaBayItems(doc);
    var nextPage = mangaBayNextPage(doc, page);
    return Response.success(items, nextPage);
}
