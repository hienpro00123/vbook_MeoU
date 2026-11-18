load("config.js");

function execute(input, page) {
    var url = absoluteUrl(page || input || "/library.html");
    if (!url) return Response.error("Đường dẫn danh sách không hợp lệ");
    return listResponse(url);
}
