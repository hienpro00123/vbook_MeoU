load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;

    if (url === "newupdate") {
        return fetchApiUpdate(p);
    }
    if (url === "completed") {
        return fetchCompleted(p);
    }
    if (url === "popular") {
        return fetchPopular(p);
    }
    return Response.error("Tab không hợp lệ");
}

function fetchApiUpdate(p) {
    var apiUrl = BASE_URL + "/api/newupdatestory?page=" + p;
    var res = fetchRetry(apiUrl);
    if (!res || !res.ok) return Response.error("Không tải được dữ liệu");
    var json = res.json();
    if (!json || !json.data) return Response.success([], null);
    var data = json.data;
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var name = item.tentruyen || "";
        if (!name) continue;
        var slug = item.slug_post || "";
        var link = "/xem-truyen/" + slug;
        var cover = item.image ? IMG_BASE + item.image : "";
        var author = item.author || "";
        result.push({ name: name, link: link, host: HOST, cover: cover, description: author });
    }
    var next = (json.current_page < json.last_page) ? String(p + 1) : null;
    return Response.success(result, next);
}

function fetchCompleted(p) {
    var fetchUrl = BASE_URL + "/truyen-hoan-thanh?page=" + p;
    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang hoàn thành");
    var doc = res.html();
    if (!doc) return Response.success([], null);
    var items = parseCards(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}

function fetchPopular(p) {
    var fetchUrl = BASE_URL + "/bang-xep-hang?page=" + p;
    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.error("Không tải được bảng xếp hạng");
    var doc = res.html();
    if (!doc) return Response.success([], null);
    var items = parseCards(doc);
    if (!items || items.length === 0) return Response.success([], null);
    var next = getNextPage(doc, p);
    return Response.success(items, next);
}
