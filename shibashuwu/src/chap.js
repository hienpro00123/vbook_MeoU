load("config.js");

function execute(url) {
    var fullUrl = url.indexOf("http") === 0 ? url : resolveUrl(url);
    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    var content = selFirst(doc, "#C0NTENT, .RBGsectionThree-content");
    if (!content) return Response.error("Khong tim thay noi dung chuong");

    var imgs = content.select("img[src*='/wzbodyimg/']");
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = String(img.attr("src"));
        var slash = src.lastIndexOf("/");
        var dot = src.lastIndexOf(".");
        var name = (slash >= 0 && dot > slash) ? src.substring(slash + 1, dot) : "";
        var ch = (name && CHAR_MAP[name]) ? CHAR_MAP[name] : "";
        img.before(ch);
        img.remove();
    }

    var paras = content.select("p");
    for (var i = 0; i < paras.size(); i++) {
        if (cleanText(paras.get(i).text()).indexOf("\u672c\u7ae0\u5df2\u9605\u8bfb\u5b8c\u6bd5") !== -1) {
            paras.get(i).remove();
        }
    }

    return Response.success(content.html());
}