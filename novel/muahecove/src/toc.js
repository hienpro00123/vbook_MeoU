load("config.js");

function execute(url) {
    // App strips trailing slash — add it back for WordPress
    var storyUrl = url.replace(/\/?$/, "/");

    var res = fetchPage(storyUrl);
    if (!res || !res.ok) return Response.error("HTTP " + (res ? res.status : 0));
    var doc = res.html();

    var chapters = doc.select("a.mhcv-chapter-item").map(function(el) {
        var name = el.text().trim();
        // Bỏ ngày đăng ở cuối (dd/mm/yyyy)
        name = name.replace(/\s+\d{2}\/\d{2}\/\d{4}\s*$/, "").trim();
        return {
            name: name,
            url: el.attr("href")
        };
    });

    return Response.success(chapters);
}
