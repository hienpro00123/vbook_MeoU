function execute(url) {
    var fullUrl = resolveUrl(url);

    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Fetch error: " + fullUrl);

    var doc = res.parse();

    // Title
    var title = "";
    var h1 = selFirst(doc, "h1");
    if (h1) title = h1.text().trim();

    // Content - reading content area (Madara theme)
    var contentEl = selFirst(doc, ".reading-content .text-left, .reading-content, .entry-content, .text-left");
    var content = "";

    if (contentEl) {
        // Remove ads, scripts, navigation, VIP announcement blocks
        contentEl.select("script, style, .code-block, .adsbygoogle, ins, .wp-block-buttons, .entry-title, .nav-links, .chapter-warning").remove();

        // Remove VIP announcement block if exists
        var allEls = contentEl.children();
        var startRemove = false;
        for (var i = 0; i < allEls.size(); i++) {
            var el = allEls.get(i);
            var txt = el.text().trim();
            if (txt.indexOf("Thông báo") !== -1 && txt.indexOf("VIP") !== -1) {
                startRemove = true;
            }
            if (startRemove && (txt.indexOf("Chương") !== -1 || txt.length > 100)) {
                startRemove = false;
            }
            if (startRemove) {
                el.remove();
            }
        }

        content = contentEl.html();
    }

    if (!content) {
        // Fallback: get all paragraphs
        var paragraphs = doc.select("p");
        var sb = [];
        for (var j = 0; j < paragraphs.size(); j++) {
            var pText = paragraphs.get(j).html();
            if (pText && pText.trim().length > 20) {
                sb.push("<p>" + pText + "</p>");
            }
        }
        content = sb.join("\n");
    }

    var result = {
        title: title,
        content: content,
        url: fullUrl
    };

    return Response.success(result);
}
