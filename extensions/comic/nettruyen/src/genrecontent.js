load("config.js");

// home/genre truyền id, detail truyền slug — REST chỉ lọc theo id
function resolveCategoryId(input) {
    var s = String(input || "").replace(/^\s+|\s+$/g, "");
    if (!s) return "";
    if (/^[0-9]+$/.test(s)) return s;
    var res = restFetch("/truyen_category?slug=" + encodeURIComponent(s) + "&_fields=id");
    var arr = restJson(res);
    if (arr && arr.length && arr[0].id) return String(arr[0].id);
    return "";
}

function execute(input, page) {
    var id = resolveCategoryId(input);
    if (!id) return Response.error("Không tìm thấy thể loại");
    var p = pageNum(page);

    var path = "/truyen?truyen_category=" + id + "&orderby=modified&order=desc" +
        "&per_page=" + PAGE_SIZE + "&page=" + p + "&_fields=" + REST_FIELDS;

    var r = restList(path, p);
    if (r.items.length === 0) return Response.success([], null);
    return Response.success(r.items, r.next);
}
