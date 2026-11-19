load('crypto.js');
load('config.js');

function execute() {
    var result = calibreJson("/ajax/library-info");
    if (result.error) return Response.error(result.error);
    if (!result.data || !result.data.library_map) return Response.error("Danh sách thư viện Calibre không hợp lệ");
    var tabs = [];
    var libraries = result.data.library_map;
    for (var id in libraries) {
        if (Object.prototype.hasOwnProperty.call(libraries, id)) {
            tabs.push({ title: libraries[id], input: id, script: "homecontent.js" });
        }
    }
    return Response.success(tabs);
}
