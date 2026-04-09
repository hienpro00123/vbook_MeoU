load("config.js");

function execute(url, page) {
    var json, items, next;

    if (url === "/novel/hot") {
        // Hot list: không có pagination
        json = fetchApi("/novel/hot");
        if (!json || json.code !== 200) return Response.error("Tải danh sách hot thất bại");
        items = json.data;
        next = null;
    } else {
        // Genre list có pagination
        var p = page || 1;
        json = fetchApi(url + "&page=" + p + "&limit=20");
        if (!json || json.code !== 200) return Response.error("Tải danh sách thất bại");
        var data = json.data;
        items = data.data;
        next = data.next_page ? data.next_page : null;
    }

    if (!items) return Response.error("Không có dữ liệu");

    var result = [];
    for (var i = 0; i < items.length; i++) {
        var n = items[i];
        var id = n.articleid;
        result.push({
            name: n.articlename || "",
            link: BASE_URL + "/novel.html?articleid=" + id,
            host: BASE_URL,
            cover: coverUrl(id),
            description: n.intro || ""
        });
    }
    return Response.success(result, next);
}
