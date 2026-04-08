load("config.js");

function execute(url) {
    var novelId = extractNovelId(url);
    Console.log("[toc] url=" + url + " novelId=" + novelId);
    if (!novelId) return Response.error("URL không hợp lệ");

    var apiPath = "/api/novels/" + novelId;
    Console.log("[toc] fetching " + API_BASE + apiPath);
    var res = fetchApi(apiPath);
    Console.log("[toc] res=" + (res ? "ok=" + res.ok + " status=" + res.status : "null"));
    if (!res) return Response.error("Không tải được danh sách chương");

    var data;
    try { data = res.json(); } catch (e) {
        Console.log("[toc] json error: " + e);
        return Response.error("Dữ liệu không hợp lệ");
    }
    Console.log("[toc] modules=" + (data.modules ? data.modules.length : "none"));
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
