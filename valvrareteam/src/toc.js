load("config.js");

function execute(url) {
    var novelId = extractNovelId(url);
    if (!novelId) return Response.error("URL không hợp lệ");

    var res = fetchApi("/api/novels/" + novelId);
    if (!res) return Response.error("Không tải được danh sách chương");

    var data;
    try { data = res.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    if (!data || !data.novel) return Response.error("Không tìm thấy truyện");

    var novel = data.novel;
    var modules = data.modules || [];
    var chapters = [];

    // Duyệt từng tập (module) → từng chương
    for (var mi = 0; mi < modules.length; mi++) {
        var mod = modules[mi];
        var modChaps = mod.chapters || [];
        for (var ci = 0; ci < modChaps.length; ci++) {
            var chap = modChaps[ci];
            // Chỉ lấy published (bỏ qua "paid" mode)
            if (chap.mode === "paid") continue;
            chapters.push({
                name: chap.title || ("Chương " + chap.order),
                url: makeChapUrl(chap._id),
                host: SITE_URL
            });
        }
    }

    return Response.success(chapters);
}
