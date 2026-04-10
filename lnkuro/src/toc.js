load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var ajaxUrl = storyUrl.replace(/\/?$/, "/") + "ajax/chapters/";
    var res = fetch(ajaxUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": storyUrl,
            "User-Agent": FETCH_HEADERS["User-Agent"]
        }
    });
    if (!res || !res.ok) return Response.error("Không tải được danh sách chương");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được danh sách chương");

    var chapters = [];
    var seen = {};
    var links = doc.select(".wp-manga-chapter a[href], li a[href]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href.indexOf("chuong") === -1) continue;
        if (seen[href]) continue;
        seen[href] = true;
        var name = a.text().trim();
        if (!name) continue;
        chapters.push({ name: name, url: href, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy chương");

    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }
    return Response.success(reversed);
}
