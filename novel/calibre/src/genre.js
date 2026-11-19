load('crypto.js');
load('config.js');

function execute() {
    var info = calibreJson("/ajax/library-info");
    if (info.error) return Response.error(info.error);
    if (!info.data || !info.data.library_map) return Response.error("Danh sách thư viện Calibre không hợp lệ");
    var genres = [];
    var libraries = Object.keys(info.data.library_map);
    for (var i = 0; i < libraries.length; i++) {
        var library = libraries[i];
        var categories = calibreJson("/ajax/categories/" + encodeURIComponent(library));
        if (categories.error) return Response.error(categories.error);
        if (!Array.isArray(categories.data)) return Response.error("Danh mục Calibre không hợp lệ");
        var tagPath = "";
        for (var k = 0; k < categories.data.length; k++) {
            if (/^\/ajax\/category\/74616773\//.test(categories.data[k].url)) {
                tagPath = categories.data[k].url;
                break;
            }
        }
        if (!tagPath) continue;
        var offset = 0;
        var total;
        do {
            var result = calibreJson(tagPath + "?num=100&offset=" + offset);
            if (result.error) return Response.error(result.error);
            var data = result.data;
            if (!data || !Array.isArray(data.items) || typeof data.total_num !== "number") {
                return Response.error("Danh sách thể loại Calibre không hợp lệ");
            }
            total = data.total_num;
            for (var j = 0; j < data.items.length; j++) {
                var item = data.items[j];
                genres.push({
                    title: libraries.length > 1 ? info.data.library_map[library] + " — " + item.name : item.name,
                    input: JSON.stringify({ library: library, path: item.url }),
                    script: "genrecontent.js"
                });
            }
            if (!data.items.length && offset < total) return Response.error("Phân trang thể loại Calibre không hợp lệ");
            offset += data.items.length;
        } while (offset < total);
    }
    return Response.success(genres);
}
