load("config.js");

function execute(url) {
    var chapUrl = url.indexOf("http") === 0 ? url : resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    var imgs = doc.select("div.contentimg img.simg");
    if (imgs.size() === 0) {
        imgs = doc.select("div.contentimg img");
    }
    if (imgs.size() === 0) return Response.error("Khong co anh trong chuong");

    var data = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var sv1 = img.attr("src") || img.attr("data-sv1") || "";
        var sv2 = img.attr("data-sv2") || "";
        var sv3 = img.attr("data-sv3") || "";
        // Fallback: tu construct DuckDuckGo proxy neu data-sv3 trong
        if (!sv3 && sv1 && sv1.indexOf("http") === 0) {
            try { sv3 = "https://external-content.duckduckgo.com/iu/?u=" + encodeURIComponent(sv1); } catch (e) { sv3 = ""; }
        }
        // sv3 (DuckDuckGo IPv4 proxy) > sv1 > sv2
        var src = sv3 || sv1 || sv2;
        if (!src || src.indexOf("data:image") === 0) continue;
        data.push({ link: src });
    }

    if (data.length === 0) return Response.error("Khong co anh hop le trong chuong");
    return Response.success(data);
}
