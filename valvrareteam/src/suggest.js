load("config.js");

function execute(url) {
    // Gợi ý: lấy danh sách truyện mới cập nhật (không có "related" API)
    var data = fetchApiJson("/api/novels?limit=10&page=1");
    if (!data || !data.novels) return Response.success([]);

    var items = [];
    var novels = data.novels;
    for (var i = 0; i < novels.length; i++) {
        var novel = novels[i];
        items.push({
            name: novel.title || "",
            cover: novel.illustration || "",
            link: makeNovelUrl(novel._id),
            description: mapStatus(novel.status),
            host: SITE_URL
        });
    }
    return Response.success(items);
}
