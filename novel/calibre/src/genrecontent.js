load('crypto.js');
load('config.js');

function execute(input, page) {
    var value;
    try {
        value = JSON.parse(input);
    } catch (e) {
        return Response.error("Thể loại không hợp lệ");
    }
    var offset = pageOffset(page);
    if (!value || !value.library || typeof value.path !== "string" ||
        !/^\/ajax\/books_in\//.test(value.path) || offset < 0) {
        return Response.error("Thể loại hoặc trang không hợp lệ");
    }
    var result = bookList(value.library, value.path, offset);
    if (result.error) return Response.error(result.error);
    return Response.success(result.data, result.next);
}
