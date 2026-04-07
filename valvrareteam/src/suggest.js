load("config.js");

function execute(url) {
    // Gợi ý: lấy danh sách truyện mới cập nhật (không có "related" API)
    var res = fetchApi("/api/novels?limit=10&page=1");
    if (!res) return Response.success([]);

    var data;
    try { data = res.json(); } catch (e) { return Response.success([]); }
    if (!data || !data.novels) return Response.success([]);

    var items = [];
    var novels = data.novels;
    for (var i = 0; i < novels.length; i++) {
        var novel = novels[i];
        items.push({
            title: novel.title || "",
            cover: novel.illustration || "",
            url: makeNovelUrl(novel._id),
            description: mapStatus(novel.status),
            host: SITE_URL
        });
    }
    return Response.success(items);
}
