load('crypto.js');
load('config.js');

function execute(query, page) {
    var info = calibreJson("/ajax/library-info");
    if (info.error) return Response.error(info.error);
    if (!info.data || !info.data.library_map) return Response.error("Danh sách thư viện Calibre không hợp lệ");
    var libraries = Object.keys(info.data.library_map).sort();
    var index = 0;
    var offset = 0;
    if (page) {
        var parts = String(page).split(":");
        if (parts.length !== 2 || !/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) {
            return Response.error("Trang tìm kiếm không hợp lệ");
        }
        index = Number(parts[0]);
        offset = Number(parts[1]);
    }
    while (index < libraries.length) {
        var library = libraries[index];
        var path = "/ajax/search/" + encodeURIComponent(library) + "?query=" + encodeURIComponent(query || "");
        var result = bookList(library, path, offset);
        if (result.error) return Response.error(result.error);
        var next = result.next ? index + ":" + result.next
            : index + 1 < libraries.length ? (index + 1) + ":0" : "";
        if (result.data.length || !next) return Response.success(result.data, next);
        index++;
        offset = 0;
    }
    return Response.success([], "");
}
