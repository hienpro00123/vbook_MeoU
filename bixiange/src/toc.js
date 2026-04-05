load("config.js");

// Precompile regex — dùng trong loop
var INDEX_PAGE_RE = /\/index_(\d+)\.html/;

// Regex nhận diện text là ký tự UI toggle — không phải tên chương thật
var UI_TOGGLE_RE = /^[+\-×✕▸▾▼▲◆□■●○\s]{1,4}$|^(展开|收起|更多|显示|隐藏)$/;
// Nhãn điều hướng — bỏ qua
var SKIP_NAME_RE = /^在线阅读$|^目录$|^上一章$|^下一章$|^上一页$|^下一页$/;

// Trích link chương từ 1 trang doc — push vào chapters/seen, trả về số chương đã thêm
function extractChaps(doc, storyPath, chapters, seen) {
    var chapLinks = doc.select(
        "a[href*='" + storyPath + "/index/'], " +
        "a[href='" + storyPath + "/'], " +
        "a[href='" + storyPath + "']"
    );
    var added = 0;
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;

        var chapName = a.text().trim();
        if (!chapName || UI_TOGGLE_RE.test(chapName)) {
            chapName = a.attr("title") || "";
            if (!chapName || UI_TOGGLE_RE.test(chapName)) continue;
        }
        if (SKIP_NAME_RE.test(chapName)) continue;
        if (chapName.length < 2) continue;
        if (seen[href]) continue;

        seen[href] = true;
        var idx = chapters.length + 1;
        chapters.push({ name: "Chương " + idx + ": " + chapName, url: href, host: HOST });
        added++;
    }
    return added;
}

function execute(url) {
    var storyUrl = resolveUrl(url);
    var doc = fetchBrowser(storyUrl, 7000);
    if (!doc) return Response.error("Lỗi tải mục lục");

    // storyUrl = "https://m.bixiange.me/wxxz/20921"
    // storyPath = "/wxxz/20921"
    var storyPath = storyUrl.replace(BASE_URL, "").replace(/\.html$/, "");

    var chapters = [];
    var seen = {};

    // Trang đầu
    extractChaps(doc, storyPath, chapters, seen);

    // Phát hiện phân trang TOC — bixiange DedeCMS dùng /storyPath/index_N.html
    // Phân biệt với URL chương: chương dùng /index/N.html (có dấu "/index/")
    var maxPage = 1;
    var pageLinks = doc.select("a[href*='" + storyPath + "/index_']");
    for (var pi = 0; pi < pageLinks.size(); pi++) {
        var ph = pageLinks.get(pi).attr("href") || "";
        var pm = INDEX_PAGE_RE.exec(ph);
        if (pm) {
            var pn = parseInt(pm[1], 10);
            if (pn > maxPage) maxPage = pn;
        }
    }

    // Fetch các trang TOC tiếp theo (tối đa 10 trang — ~500 chương)
    for (var p = 2; p <= maxPage && p <= 10; p++) {
        var pageUrl = BASE_URL + storyPath + "/index_" + p + ".html";
        var pageDoc = fetchBrowser(pageUrl, 5000);
        if (!pageDoc) break;
        extractChaps(pageDoc, storyPath, chapters, seen);
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(chapters);
}
