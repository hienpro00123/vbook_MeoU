load("config.js");

function isNovel(s) {
    var t = (s.title || "").toUpperCase();
    if (t.indexOf("[NOVEL]") >= 0 || t.indexOf("[FULL] [NOVEL]") >= 0) return true;
    var sl = s.slug || "";
    if (sl.indexOf("novel-") >= 0 || sl.indexOf("full-novel-") >= 0) return true;
    return false;
}

function execute(keyword, page) {
    var q = encodeURIComponent(keyword);
    var fetchUrl = BASE_URL + "/api/search-story?keyword=" + q;

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.success([], null);

    var json;
    try { json = res.json(); } catch (e) { return Response.success([], null); }
    if (!json || json.length === 0) return Response.success([], null);

    var items = [];
    for (var i = 0; i < json.length; i++) {
        var s = json[i];
        if (!s.slug || !s.title) continue;
        var cover = "";
        if (s.cover) {
            if (s.cover.indexOf("http") === 0) {
                cover = s.cover;
            } else {
                cover = BASE_URL + "/storage/" + s.cover;
            }
        }
        var name = s.title;
        var desc = isNovel(s) ? "[Novel]" : "";
        items.push({
            name: adultName(name),
            cover: isAdult(name) ? "" : cover,
            link: BASE_URL + "/truyen/" + s.slug,
            description: desc,
            host: HOST
        });
    }

    return Response.success(items, null);
}
