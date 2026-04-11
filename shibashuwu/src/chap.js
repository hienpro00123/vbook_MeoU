load("config.js");

function execute(url) {
    var res = fetchRetry(resolveUrl(url));
    if (!res || !res.ok) {
        return Response.error("Khong tai duoc noi dung chuong");
    }

    var doc = res.html();
    var content = selFirst(doc, "#C0NTENT, .RBGsectionThree-content");
    if (!content) {
        return Response.error("Khong tim thay noi dung chuong");
    }

    var paragraphs = content.select("p");
    for (var i = 0; i < paragraphs.size(); i++) {
        var text = cleanText(paragraphs.get(i).text());
        if (text.indexOf("本章已阅读完毕") !== -1) {
            paragraphs.get(i).remove();
        }
    }

    return Response.success(content.html());
}
