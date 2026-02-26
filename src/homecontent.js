load("config.js");

// Nội dung trang chủ: Danh sách sách
// url = "sort_field:sort_order" (vd: "timestamp:desc", "authors:asc")
//   hoặc URL API (vd: "/ajax/books_in/...")
// page = offset phân trang (null = trang đầu)
function execute(url, page) {
    return fetchBooksList(url, page);
}
