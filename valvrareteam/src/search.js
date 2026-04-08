load("config.js");

function execute(keyword, page) {
    var q = encodeURIComponent(keyword);
    var data = fetchApiJson("/api/novels/search?title=" + q);
    if (!data || !data.length) return Response.success([], null);

    var items = [];
    for (var i = 0; i < data.length; i++) {
        var novel = data[i];
        items.push({
            name: novel.title || "",
            cover: novel.illustration || "",
            link: makeNovelUrl(novel._id),
            description: "Tác giả: " + (novel.author || "") + " | " + mapStatus(novel.status) + " | " + (novel.totalChapters || 0) + " chương"
        });
    }

    // Search API không phân trang → không có trang tiếp
    return Response.success(items, null);
}
