load("config.js");

function execute(url) {
    var chapId = extractChapId(url);
    var novelId = extractNovelId(url);
    if (!chapId) return Response.error("URL chương không hợp lệ");

    // Strategy 1: Scrape website HTML via WebView (most reliable)
    if (novelId) {
        var webUrl = SITE_URL + "/truyen/x-" + shortId(novelId) + "/chuong/" + shortId(chapId);
        var browser = Engine.newBrowser();
        try {
            var doc = browser.launch(webUrl, 15000);
            if (doc) {
                var content = doc.selectFirst(".chapter-content");
                if (content) {
                    content.select("script, style, noscript, iframe").remove();
                    return Response.success(content.html());
                }
            }
        } catch(e) {
        } finally {
            try { browser.close(); } catch(e2) {}
        }
    }

    // Strategy 2: API JSON fallback
    var data = fetchApiJson("/api/chapters/" + chapId);
    if (data && data.chapter && data.chapter.content) {
        return Response.success(data.chapter.content);
    }

    return Response.error("Không tải được nội dung chương");
}
