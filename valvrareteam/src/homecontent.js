load("config.js");

function execute(input, page) {
    var p = page ? parseInt(page) : 1;
    var url = input + "&page=" + p;

    var data = fetchJson(url);
    if (!data || !data.novels) return Response.success([], null);

    var items = [];
    var novels = data.novels;
    for (var i = 0; i < novels.length; i++) {
        var novel = novels[i];
        // Lấy chương mới nhất từ chapters array (đầu tiên trong list)
        var latestChap = "";
        var recentChaps = novel.chapters || [];
        if (recentChaps.length > 0) {
            latestChap = recentChaps[0].title || "";
        }
        items.push({
            name: novel.title || "",
            cover: novel.illustration || "",
            link: makeNovelUrl(novel._id),
            description: mapStatus(novel.status) + (latestChap ? " | " + latestChap : "")
        });
    }

    // Trang tiếp
    var pagination = data.pagination || {};
    var totalPages = pagination.totalPages || 1;
    var next = (p < totalPages) ? (p + 1) : null;

    return Response.success(items, next);
}
