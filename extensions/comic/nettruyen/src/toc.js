load("config.js");

function execute(url) {
    var slug = url.replace(/.*\/truyen-tranh\/([^\/\?#]+).*/, "$1");
    if (!slug || slug === url) return Response.error("Không lấy được slug từ URL");

    // --- Cách 1: Gọi API ChapterList (trả ALL chapters) ---
    var apiUrl = BASE_URL + "/Comic/Services/ComicService.asmx/ChapterList?slug=" + slug;
    var json = null;
    var res = fetch(apiUrl, FETCH_OPTIONS);
    if (res && res.ok) {
        try { json = res.json(); } catch (e) {}
    }

    if (json && json.data && json.data.length > 0) {
        var chapters = [];
        for (var i = json.data.length - 1; i >= 0; i--) {
            var item = json.data[i];
            var chapUrl = BASE_URL + "/truyen-tranh/" + slug + "/chuong-" + item.chapter_num;
            chapters.push({ name: item.chapter_name, url: chapUrl, host: HOST });
        }
        return Response.success(chapters);
    }

    // --- Cách 2: Fallback scrape HTML từ detail page ---
    var pageUrl = BASE_URL + "/truyen-tranh/" + slug;
    var doc = null;

    // Thử fetch HTML trước
    var pageRes = fetchRetry(pageUrl);
    if (pageRes && pageRes.ok) {
        try { doc = pageRes.html(); } catch (e) {}
    }

    // Nếu fetch fail → dùng WebView
    if (!doc) {
        var browser = Engine.newBrowser();
        try {
            doc = browser.launch(pageUrl, 15000);
        } catch (e) {
        } finally {
            try { browser.close(); } catch (e2) {}
        }
    }

    if (!doc) return Response.error("Không tải được trang truyện");

    var links = doc.select("#chapter_list li a[href], #nt_listchapter li a[href], .list-chapter li a[href]");
    if (links.size() === 0) return Response.error("Không tìm thấy danh sách chương");

    var chapters = [];
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        var name = a.text().trim();
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
