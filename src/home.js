load("config.js");

// Trang chủ: Hiển thị các tab duyệt thư viện Calibre
function execute() {
    return Response.success([
        {
            title: "Mới cập nhật",
            input: "timestamp:desc",
            script: "homecontent.js"
        },
        {
            title: "Mới thêm vào",
            input: "last_modified:desc",
            script: "homecontent.js"
        },
        {
            title: "Đánh giá cao",
            input: "rating:desc",
            script: "homecontent.js"
        },
        {
            title: "Tên A → Z",
            input: "authors:asc",
            script: "homecontent.js"
        }
    ]);
}
