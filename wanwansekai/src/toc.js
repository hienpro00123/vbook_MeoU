load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc danh sach chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc danh sach chuong");

    var links = doc.select(".listing-chapters_wrap .main li a[href], .wp-manga-chapter a[href]");
    var chapters = [];
    var seen = {};

    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || HREF_SKIP_RE.test(href)) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        if (href === storyUrl || seen[href]) continue;
        if (href.indexOf(storyUrl.replace(/\/?$/, "/")) !== 0) continue;

        var name = a.text().trim();
        if (!name) continue;

        seen[href] = true;
        chapters.push({ name: name, url: href, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Khong tim thay danh sach chuong");

    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }

    return Response.success(reversed);
}