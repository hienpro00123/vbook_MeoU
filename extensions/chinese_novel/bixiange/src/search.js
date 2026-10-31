load("config.js");

// DedeCMS chỉ nhận search qua POST, body phải mã hoá GBK.
// WebView submit form giúp trình duyệt tự encode đúng charset của trang.
function searchByForm(keyword) {
    var browser = Engine.newBrowser();
    try {
        browser.launch(BASE_URL + "/", 15000);
        var js = "(function(){var f=document.forms['search_js1'];"
            + "if(!f)return '0';var k=f.elements['keyboard'];if(!k)return '0';"
            + "k.value=" + JSON.stringify(keyword) + ";f.submit();return '1';})()";
        try {
            browser.callJs(js, 5000);
        } catch (e) {}
        return browser.html(15000);
    } catch (e2) {
        return null;
    } finally {
        try {
            browser.close();
        } catch (e3) {}
    }
}

function execute(key, page) {
    key = (key || "").trim();
    if (key.length < 4) return Response.error("Từ khóa phải có ít nhất 4 ký tự");
    if (key.length > 20) return Response.error("Từ khóa tối đa 20 ký tự");

    var doc = searchByForm(key);
    if (!doc) return Response.error("Lỗi tìm kiếm");

    var items = parseList(doc);
    if (!items || items.length === 0) return Response.error("Không có kết quả");
    return Response.success(items, null);
}
