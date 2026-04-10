load("config.js");

function execute(input, page) {
    var p = page ? parseInt(page) : 1;
    var apiUrl = BASE_URL + "/api/newupdatestory?page=" + p;
    var res = fetchRetry(apiUrl);
    if (!res || !res.ok) return Response.success([], null);
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
