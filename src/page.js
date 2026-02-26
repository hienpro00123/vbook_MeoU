load("config.js");

// Page: Xác định định dạng đọc và trả về danh sách trang mục lục
// url = URL detail sách (vd: "http://localhost:8080/book/123")
function execute(url) {
    var bookId = extractBookId(url);

    // Lấy metadata sách để biết có những định dạng nào
    var metaResponse = calibreFetch("/ajax/book/" + bookId + libraryPath());
    if (!metaResponse.ok) {
        return Response.error("Không thể tải thông tin sách");
    }

    var meta = metaResponse.json();
    var formats = meta.formats || [];
    var pages = [];

    // Ưu tiên EPUB (có TOC), rồi TXT (đọc được), rồi format khác
    var preferredOrder = ["epub", "txt", "azw3", "mobi", "pdf", "docx", "rtf", "html", "htmlz"];
    var selectedFmt = null;

    for (var i = 0; i < preferredOrder.length; i++) {
        if (formats.indexOf(preferredOrder[i]) >= 0) {
            selectedFmt = preferredOrder[i];
            break;
        }
    }

    // Nếu không khớp preferred, dùng format đầu tiên
    if (!selectedFmt && formats.length > 0) {
        selectedFmt = formats[0];
    }

    if (!selectedFmt) {
        return Response.error("Sách không có định dạng nào để đọc");
    }

    if (selectedFmt === "epub" || selectedFmt === "azw3" || selectedFmt === "mobi") {
        // Lấy manifest sách (chứa TOC, spine, book_hash)
        // Route: /book-manifest/{book_id}/{fmt}?library_id=xxx
        // LƯU Ý: library_id là query param, KHÔNG phải path segment!
        pages.push(BASE_URL + "/book-manifest/" + bookId + "/" + selectedFmt.toUpperCase() + libraryQuery());
    } else if (selectedFmt === "txt") {
        // TXT: Đọc toàn bộ nội dung text
        pages.push("txt:" + bookId);
    } else {
        // Format khác: thử đọc như text
        pages.push("fmt:" + selectedFmt + ":" + bookId);
    }

    return Response.success(pages);
}
