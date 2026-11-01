load("config.js");

function execute(key, page) {
    // Use search suggestions API
    var searchUrl = BASE_URL + "/pages/search_suggestions.php?query=" + encodeURIComponent(key);
    var headers = {
        "User-Agent": FETCH_HEADERS["User-Agent"],
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": FETCH_HEADERS["Accept-Language"],
        "X-Requested-With": "XMLHttpRequest",
        "Referer": BASE_URL + "/"
    };
    var res = fetch(searchUrl, { headers: headers });
    if (!res || !res.ok) return Response.error("Không tìm được kết quả");

    var data = null;
    try {
        data = res.json();
    } catch (e) {
        return Response.error("Lỗi tìm kiếm");
    }

    if (!data || data.length === 0) return Response.success([], null);

    var result = [];
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var slug = item.slug || "";
        var title = item.tieude || "";
        var author = item.tacgia || "";
        if (!slug || !title) continue;

        result.push({
            name: title,
            link: "/truyen/" + slug,
            host: HOST,
            cover: "",
            description: author ? "Tác giả: " + author : ""
        });
    }

    return Response.success(result, null);
}
