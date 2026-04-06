load("config.js");

function execute(url) {
    var storyUrl = (url.indexOf("http") === 0) ? url : BASE_URL + url;
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được mục lục");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được mục lục");

    var links = doc.select("#chapter_list li a[href]");
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

    // HTML có chương mới nhất trước → đảo ngược để chương 1 trước
    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }

    return Response.success(reversed);
}
