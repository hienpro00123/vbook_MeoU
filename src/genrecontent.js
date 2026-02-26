load("config.js");

// Nội dung thể loại: Danh sách sách theo tag/tác giả/thể loại
// url = URL API từ genre.js (vd: /ajax/books_in/tags/1/library)
// page = offset phân trang
function execute(url, page) {
    return fetchBooksList(url, page);
}
