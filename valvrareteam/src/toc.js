load("config.js");

function execute(url) {
    var novelId = extractNovelId(url);
    if (!novelId) return Response.error("URL không hợp lệ");

    var data = fetchApi("/api/novels/" + novelId);
    if (!data || !data.novel) return Response.error("Không tải được danh sách chương");

    var modules = data.modules || [];
    var chapters = [];

    for (var mi = 0; mi < modules.length; mi++) {
        var mod = modules[mi];
        var modChaps = mod.chapters || [];
        for (var ci = 0; ci < modChaps.length; ci++) {
            var chap = modChaps[ci];
            if (chap.mode === "paid") continue;
            chapters.push({
                name: chap.title || ("Chương " + chap.order),
                url: makeChapUrl(novelId, chap._id),
                host: BASE_URL
            });
        }
    }

    return Response.success(chapters);
}
