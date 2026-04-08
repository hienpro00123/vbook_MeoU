load("config.js");

function execute(url) {
    var chapId = extractChapId(url);
    Console.log("[chap] url=" + url + " chapId=" + chapId);
    if (!chapId) return Response.error("URL chương không hợp lệ");

    // Thử fetch API trước
    var apiUrl = API_BASE + "/api/chapters/" + chapId;
    Console.log("[chap] fetching " + apiUrl);
    var res = fetch(apiUrl);
    Console.log("[chap] res=" + (res ? "ok=" + res.ok + " status=" + res.status : "null"));

    // Fallback: thử fetch với headers
    if (!res || !res.ok) {
        Console.log("[chap] retry with headers");
        res = fetch(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
                "Accept": "application/json"
            }
        });
        Console.log("[chap] retry res=" + (res ? "ok=" + res.ok + " status=" + res.status : "null"));
    }

    if (!res || !res.ok) return Response.error("Không tải được nội dung chương");

    var data;
    try { data = res.json(); } catch (e) {
        Console.log("[chap] json error: " + e);
        return Response.error("Dữ liệu không hợp lệ");
    }
    Console.log("[chap] has chapter=" + (data && data.chapter ? "yes" : "no"));
    if (!data || !data.chapter) return Response.error("Không tìm thấy chương");

    var content = data.chapter.content || "";
    Console.log("[chap] content length=" + content.length);
    if (!content) return Response.error("Chương không có nội dung");

    return Response.success(content);
}
