load("config.js");

function execute(url) {
    var slug = url.replace(/.*\/truyen-tranh\/([^\/\?#]+).*/, "$1");
    if (!slug || slug === url) return Response.error("Không lấy được slug từ URL");

    var apiUrl = BASE_URL + "/Comic/Services/ComicService.asmx/ChapterList?slug=" + slug;

    // Thử fetch thường trước
    var json = null;
    var res = fetchRetry(apiUrl);
    if (res && res.ok) {
        try { json = res.json(); } catch (e) {}
    }

    // Fallback: dùng WebView để bypass Cloudflare
    if (!json || !json.data) {
        var browser = Engine.newBrowser();
        try {
            var doc = browser.launch(apiUrl, 15000);
            if (doc) {
                var rawText = "";
                var pre = doc.selectFirst("pre");
                if (pre) {
                    rawText = pre.text();
                } else {
                    rawText = doc.body().text();
                }
                if (rawText && rawText.indexOf('"data"') >= 0) {
                    try { json = JSON.parse(rawText); } catch (e) {}
                }
            }
        } catch (e) {
        } finally {
            try { browser.close(); } catch (e2) {}
        }
    }

    if (!json || !json.data) return Response.error("Không tải được danh sách chương");

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
