load("config.js");

var CHAP_RE = /\/truyen\/([^\/]+)\/([^\/\?]+)/;

function execute(url) {
    var m = CHAP_RE.exec(url);
    var story, chap;
    if (m) { story = m[1]; chap = m[2]; }
    else {
        var parts = url.replace(/^\/+/, "").split("/");
        if (parts.length < 2) return Response.error("");
        story = parts[parts.length - 2]; chap = parts[parts.length - 1];
    }

    // API first (fast ~200ms)
    var json = apiJson("/chapters/" + story + "/" + chap);
    if (json && json.data) {
        var c = json.data.rewrittenContent || json.data.content || "";
        if (c) return Response.success(c.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>"));
    }

    // Fallback: WebView
    var browser = Engine.newBrowser();
    try {
        var doc = browser.launch(HOST + "/truyen/" + story + "/" + chap, 15000);
        if (doc) {
            var el = doc.select(".chapter-content, .reading-content, #chapter-content, .prose").get(0);
            if (el) {
                el.select("script, style, noscript, iframe, ins, .ads").remove();
                return Response.success(el.html());
            }
        }
    } catch (e) {} finally { try { browser.close(); } catch (e2) {} }
    return Response.error("");
}
