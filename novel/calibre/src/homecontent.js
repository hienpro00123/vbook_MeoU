load('crypto.js');
load('config.js');

function execute(library, page) {
    var offset = pageOffset(page);
    if (!library || offset < 0) return Response.error("Thư viện hoặc trang không hợp lệ");
    var result = bookList(library, "/ajax/search/" + encodeURIComponent(library) + "?query=", offset);
    if (result.error) return Response.error(result.error);
    return Response.success(result.data, result.next);
}
