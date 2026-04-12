load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc danh sach chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc trang truyen");

    var links = doc.select(".chapter-list a[href*='/chap-'], a[href*='/chap-']");
    var chapters = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        if (seen[href]) continue;
        seen[href] = true;

        var nameEl = selFirst(a, "h3");
        var name = nameEl ? nameEl.text().trim() : a.text().trim().replace(/\s+/g, " ");
        if (!name) continue;

        chapters.push({ name: adultName(name), url: href, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Khong tim thay danh sach chuong");

    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }

    return Response.success(reversed);
}
