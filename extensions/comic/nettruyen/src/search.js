load("config.js");

function execute(keyword, page) {
    var q = (keyword || "").replace(/^\s+|\s+$/g, "");
    if (!q) return Response.success([], null);
    var p = pageNum(page);

    var path = "/truyen?search=" + encodeURIComponent(q) +
        "&per_page=" + PAGE_SIZE + "&page=" + p + "&_fields=" + REST_FIELDS;

    var r = restList(path, p);
    return Response.success(r.items, r.next);
}
