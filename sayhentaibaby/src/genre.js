load("config.js");

function execute(input) {
    var res = fetchRetry(BASE_URL + "/");
    if (!res || !res.ok) return Response.error("Khong tai duoc trang chu");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    var result = [];
    var seen = {};
    // Chỉ lấy từ navbar ul#menu-header, tránh lấy từ story cards
    var links = doc.select("ul#menu-header a[href*='/the-loai/']");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href");
        if (!href || seen[href]) continue;
        seen[href] = true;
        var title = a.attr("title") || "";
        var name = title.indexOf("Thể loại") === 0 ? title.substring(8).trim() : title.trim();
        if (!name) name = a.text().replace(/^-\s*/, "").trim();
        if (!name) continue;
        result.push({ name: name, input: resolveUrl(href) + "?order_by=update_time&sort=desc", script: "genrecontent.js" });
    }

    if (result.length === 0) return Response.error("Khong co the loai");
    return Response.success(result);
}
