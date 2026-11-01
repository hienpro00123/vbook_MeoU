load("config.js");

function execute() {
    var res = restFetch("/truyen_category?per_page=100&_fields=id,name,count");
    var arr = restJson(res);
    if (!arr || !arr.length) return Response.error("Không tải được danh sách thể loại");

    var found = [];
    for (var i = 0; i < arr.length; i++) {
        var c = arr[i];
        if (!c || !c.id) continue;
        var rawName = c.name;
        if (rawName && typeof rawName !== "string") rawName = rawName.rendered || "";
        var title = decodeEntities(rawName || "");
        var count = c.count || 0;
        if (!title || count <= 0) continue;
        found.push({ title: title, input: String(c.id), count: count });
    }
    if (found.length === 0) return Response.error("Không tìm thấy thể loại");

    found.sort(function (a, b) { return b.count - a.count; });

    var out = [];
    for (var j = 0; j < found.length; j++) {
        out.push({ title: found[j].title, input: found[j].input, script: "genrecontent.js" });
    }
    return Response.success(out);
}
