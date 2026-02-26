load("config.js");

// Gợi ý: Danh sách sách liên quan (cùng tác giả, cùng series, cùng tag)
// url = URL tìm kiếm từ detail.js (vd: /ajax/search?q=authors:"tên")
// page = offset phân trang
function execute(url, page) {
    return fetchBooksList(url, page);
}
