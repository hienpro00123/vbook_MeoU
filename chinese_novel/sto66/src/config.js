var BASE_URL = "https://www.sto66.com";

function absoluteUrl(url) {
    if (!url) return "";
    if (url.indexOf("https://www.sto66.com/") === 0) return url;
    if (url.indexOf("https://sto66.com/") === 0) return BASE_URL + url.substring("https://sto66.com".length);
    if (url.indexOf("http://www.sto66.com/") === 0) return BASE_URL + url.substring("http://www.sto66.com".length);
    if (url.indexOf("http://sto66.com/") === 0) return BASE_URL + url.substring("http://sto66.com".length);
    if (url.charAt(0) === "/" && url.charAt(1) !== "/") return BASE_URL + url;
    return "";
}

function listBooks(doc) {
    var nodes = doc.select(".bookbox");
    var items = [];
    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        var link = node.select("h2.bookname a");
        var url = absoluteUrl(link.attr("href"));
        var name = link.text().trim();
        if (!url || !name) continue;
        items.push({
            name: name,
            link: url,
            host: BASE_URL,
            cover: node.select("img").attr("src") || "",
            description: node.select(".author").text()
        });
    }
    return items;
}

function listResponse(url) {
    var res = fetch(url);
    if (!res || !res.ok) return Response.error("Không tải được danh sách (HTTP " + (res ? res.status : "không kết nối") + ")");
    var doc = res.html();
    var items = listBooks(doc);
    var next = absoluteUrl(doc.select("#pagelink a.next").attr("href"));
    return Response.success(items, next || null);
}
