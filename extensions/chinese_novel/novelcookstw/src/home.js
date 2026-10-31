load("config.js");
function execute() {
    var tabs = [
        { title: "Nổi Bật", input: "/novel/hot", script: "homecontent.js" }
    ];

    var r = fetchApi("/novel/rank/fanqie");
    var groups = (r && r.json && r.json.code === 200) ? r.json.data : null;
    var seen = {};
    if (groups) {
        for (var i = 0; i < groups.length; i++) {
            var name = groups[i].rank_name;
            if (!name || seen[name] || !groups[i].books || !groups[i].books.length) continue;
            seen[name] = true;
            tabs.push({ title: name, input: name, script: "rankcontent.js" });
        }
    }

    if (tabs.length === 1) {
        tabs.push({ title: "Bảng Xếp Hạng", input: "", script: "rankcontent.js" });
    }
    return Response.success(tabs);
}
