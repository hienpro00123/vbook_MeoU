load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    if (storyUrl.charAt(storyUrl.length - 1) !== "/") storyUrl += "/";

    // Madara WP-Manga: POST {storyUrl}ajax/chapters/ trả về danh sách chương
    var ajaxUrl = storyUrl + "ajax/chapters/";
    var ajaxRes = fetch(ajaxUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": storyUrl,
            "User-Agent": FETCH_HEADERS["User-Agent"]
        }
    });
    if (!ajaxRes || !ajaxRes.ok) return Response.error("Không tải được danh sách chương");
    var ajaxDoc = ajaxRes.html();
    if (!ajaxDoc) return Response.error("Không đọc được danh sách chương");

    var chapters = [];
    var seen = {};
    var links = ajaxDoc.select("li.wp-manga-chapter a[href]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        if (seen[href]) continue;
        seen[href] = true;
        var chapName = a.text().replace(/\s+/g, " ").trim();
        if (!chapName) continue;
        chapters.push({ name: chapName, url: href, host: HOST });
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");

    // AJAX trả mới nhất trước → đảo lại để chương 1 đứng đầu
    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }

    return Response.success(reversed);
}
