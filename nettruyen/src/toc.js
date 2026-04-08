load("config.js");

function execute(url) {
    // Extract comic slug from URL: /truyen-tranh/{slug}
    var slug = url.replace(/.*\/truyen-tranh\/([^\/\?#]+).*/, "$1");
    if (!slug || slug === url) return Response.error("Không lấy được slug từ URL");

    var apiUrl = BASE_URL + "/Comic/Services/ComicService.asmx/ChapterList?slug=" + slug;
    Console.log("[toc] apiUrl=" + apiUrl);

    var res = fetchRetry(apiUrl);
    Console.log("[toc] res=" + (res ? "ok=" + res.ok + " status=" + res.status : "null"));
    if (!res || !res.ok) return Response.error("Không tải được danh sách chương (status=" + (res ? res.status : "null") + ")");

    var json;
    try {
        json = res.json();
    } catch (e) {
        Console.log("[toc] json parse error: " + e);
        return Response.error("Lỗi parse JSON chương");
    }
    Console.log("[toc] json=" + (json ? "data.length=" + (json.data ? json.data.length : "no data") : "null"));
    if (!json || !json.data) return Response.error("API không trả dữ liệu chương");

    var data = json.data;
    // API trả mới nhất trước → đảo ngược để chương 1 đầu tiên
    var chapters = [];
    for (var i = data.length - 1; i >= 0; i--) {
        var item = data[i];
        var chapUrl = BASE_URL + "/truyen-tranh/" + slug + "/chuong-" + item.chapter_num;
        chapters.push({ name: item.chapter_name, url: chapUrl, host: HOST });
    }

    return Response.success(chapters);
}
