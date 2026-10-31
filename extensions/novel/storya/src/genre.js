load("config.js");

function execute() {
    var json = apiJson("/genres");
    if (!json || !json.data) return Response.error("Không tải được danh sách thể loại");
    var r = [];
    for (var i = 0; i < json.data.length; i++) {
        r.push({ title: json.data[i].name, input: json.data[i].id + "", script: "genrecontent.js" });
    }
    return Response.success(r);
}
