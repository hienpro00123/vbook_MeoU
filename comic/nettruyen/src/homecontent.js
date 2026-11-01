load("config.js");

function execute(orderby, page) {
    var key = (orderby === "date") ? "date" : "modified";
    var p = pageNum(page);

    var path = "/truyen?orderby=" + key + "&order=desc" +
        "&per_page=" + PAGE_SIZE + "&page=" + p +
        "&truyen_category_exclude=" + ADULT_CATEGORIES +
        "&_fields=" + REST_FIELDS;

    var r = restList(path, p);
    if (r.items.length === 0) return Response.success([], null);
    return Response.success(r.items, r.next);
}
