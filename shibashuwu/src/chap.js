load("config.js");

function execute(url) {
    var fullUrl = resolveUrl(url);
    var doc = null;

    var browser = Engine.newBrowser();
    try {
        doc = browser.launch(fullUrl, 12000);
    } catch (e) {
        doc = null;
    }
    try { browser.close(); } catch (e2) {}

    if (!doc) {
        var res = fetchRetry(fullUrl);
        if (res && res.ok) {
            doc = res.html();
        }
    }

    if (!doc) {
        return Response.error("Khong tai duoc noi dung chuong");
    }

    var content = selFirst(doc, "#C0NTENT, .RBGsectionThree-content");
    if (!content) {
        return Response.error("Khong tim thay noi dung chuong");
    }

    // Xoa img thay the ky tu bi kiem duyet (wzbodyimg) -> tranh [OBJ]
    content.select("img[src*='/wzbodyimg/']").remove();

    var paragraphs = content.select("p");
    for (var i = 0; i < paragraphs.size(); i++) {
        var text = cleanText(paragraphs.get(i).text());
        if (text.indexOf("本章已阅读完毕") !== -1) {
            paragraphs.get(i).remove();
        }
    }

    return Response.success(content.html());
}
