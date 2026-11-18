load("config.js");

function execute(query, page) {
    query = String(query || "").trim();
    if (!query) return Response.success([], null);
    var url = page ? absoluteUrl(page) : BASE_URL + "/search/" + encodeURIComponent(query) + ".html";
    if (!url) return Response.error("Đường dẫn tìm kiếm không hợp lệ");
    return listResponse(url);
}
