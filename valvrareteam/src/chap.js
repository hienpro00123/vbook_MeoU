load("config.js");

function execute(url) {
    var chapId = extractChapId(url);
    var novelId = extractNovelId(url);
    if (!chapId || !novelId) return Response.error("URL chương không hợp lệ");

    var webUrl = BASE_URL + "/truyen/x-" + shortId(novelId) + "/chuong/" + shortId(chapId);
    var browser = Engine.newBrowser();
    try {
        var doc = browser.launch(webUrl, 15000);
        if (doc) {
            var el = doc.selectFirst(".chapter-content");
            if (el) {
                el.select("script, style, noscript, iframe").remove();
                return Response.success(el.html());
            }
        }
    } catch(e) {
    } finally {
        try { browser.close(); } catch(e2) {}
    }
    return Response.error("Không tải được nội dung chương");
}
