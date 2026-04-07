load("config.js");

function execute(novelId, page) {
    var p = page ? parseInt(page) : 1;
    var url = API_BASE + "/api/comments/novel/" + novelId + "?sort=newest&page=" + p + "&limit=10&hideChapterComments=false";

    var res = fetch(url);
    if (!res || !res.ok) return Response.success([]);

    var data;
    try { data = res.json(); } catch (e) { return Response.success([]); }

    var comments = data.comments || [];
    var items = [];
    for (var i = 0; i < comments.length; i++) {
        var c = comments[i];
        var user = (c.user && c.user.displayName) ? c.user.displayName : "Ẩn danh";
        items.push({
            name: user,
            content: c.content || "",
            description: c.createdAt ? c.createdAt.substring(0, 10) : ""
        });
    }
    var pg = data.pagination || {}; var next = (pg.hasNext) ? String(p + 1) : null; return Response.success(items, next);
}
