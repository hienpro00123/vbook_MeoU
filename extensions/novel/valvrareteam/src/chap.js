load("config.js");

function execute(url) {
    var chapId = extractChapId(url);
    var novelId = extractNovelId(url);
    if (!chapId || !novelId) return Response.error("URL chương không hợp lệ");

    var webUrl = BASE_URL + "/truyen/x-" + shortId(novelId) + "/chuong/" + shortId(chapId);
    var res = fetch(webUrl);
    if (res && res.ok) {
        var doc = res.html();
        var els = doc.select(".chapter-content");
        var el = els.size() > 0 ? els.get(0) : null;
        if (el) {
            el.select("script, style, noscript, iframe").remove();
            return Response.success(el.html());
        }
    }
    return Response.error("Không tải được nội dung chương");
}
