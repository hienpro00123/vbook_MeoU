load("config.js");

// Tìm kiếm: Sử dụng Calibre search API
// key = từ khóa tìm kiếm
// page = offset phân trang (null = trang đầu)
function execute(key, page) {
    var offset = page ? parseInt(page) : 0;
    var num = PAGE_SIZE;

    // Calibre search hỗ trợ cú pháp nâng cao:
    // - title:"tên sách" : tìm theo tên
    // - authors:"tên tác giả" : tìm theo tác giả
    // - tags:"thể loại" : tìm theo tag
    // - series:"tên series" : tìm theo series
    // - publisher:"NXB" : tìm theo nhà xuất bản
    // - Tìm thường: tìm trong tất cả metadata
    var searchUrl = "/ajax/search" + libraryPath()
        + "?q=" + encodeURIComponent(key)
        + "&num=" + num
        + "&offset=" + offset
        + "&sort=timestamp&sort_order=desc";

    var response = calibreFetch(searchUrl);
    if (response.ok) {
        var data = response.json();
        var bookIds = data.book_ids || [];
        var totalNum = data.total_num || 0;

        if (bookIds.length === 0) {
            return Response.success([], null);
        }

        // Lấy metadata đầy đủ
        var meta = getBooksMeta(bookIds);
        var books = [];
        for (var i = 0; i < bookIds.length; i++) {
            var id = bookIds[i];
            var m = meta[String(id)] || meta[id];
            if (m) {
                books.push(toBookItem(id, m));
            }
        }

        var next = (offset + num < totalNum) ? String(offset + num) : null;
        return Response.success(books, next);
    }
    return Response.error("Không thể tìm kiếm. Kiểm tra kết nối Calibre server.");
}
