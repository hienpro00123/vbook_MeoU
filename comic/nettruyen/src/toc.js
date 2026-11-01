load("config.js");

function execute(url) {
    var storyUrl = (url.indexOf("http") === 0) ? url : BASE_URL + url;
    var doc = null;

    var res = fetchRetry(storyUrl);
    if (res && res.ok) {
        try { doc = res.html(); } catch (e) {}
    }

    if (!doc) {
        var browser = Engine.newBrowser();
        try {
            doc = browser.launch(storyUrl, 15000);
        } catch (e) {
        } finally {
            try { browser.close(); } catch (e2) {}
        }
    }

    if (!doc) return Response.error("Không tải được trang truyện");

    var links = doc.select("#chapterList .ten-chapter a");
    if (links.size() === 0) links = doc.select(".cl-body a[href*='/chuong-']");
    if (links.size() === 0) return Response.error("Không tìm thấy danh sách chương");

    var chapters = [];
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var name = links.get(i).text().trim();
        if (!href || !name) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        chapters.push({ name: name, url: href, host: HOST });
    }

    // HTML trả mới nhất trước → đảo ngược
    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }
    return Response.success(reversed);
}
