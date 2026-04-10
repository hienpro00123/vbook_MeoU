load("config.js");

function execute(url) {
    var fullUrl = resolveUrl(url);

    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Fetch error: " + fullUrl);

    var doc = res.html();

    var chapters = [];
    var seen = {};

    // Find chapter links - look for links containing "chuong" in href
    var allLinks = doc.select("a[href*=chuong]");
    for (var i = 0; i < allLinks.size(); i++) {
        var a = allLinks.get(i);
        var href = a.attr("href") || "";
        var text = a.text().trim();

        // Skip navigation links, empty, or non-chapter links
        if (!href || !text) continue;
        if (href.indexOf("/the-loai/") !== -1) continue;
        if (href.indexOf("/tag/") !== -1) continue;
        if (text === "‹ Trước" || text === "Sau ›") continue;
        if (text.indexOf("Đọc ngay") !== -1) continue;

        // Must contain "chuong" or "Chương" to be a chapter link
        var lowerText = text.toLowerCase();
        var lowerHref = href.toLowerCase();
        if (lowerHref.indexOf("chuong") === -1) continue;

        // Skip duplicates
        if (seen[href]) continue;
        seen[href] = true;

        // Try to find date
        var date = "";

        chapters.push({
            name: text,
            url: href,
            date: date
        });
    }

    return Response.success(chapters);
}
