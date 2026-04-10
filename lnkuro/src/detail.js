function execute(url) {
    var fullUrl = resolveUrl(url);

    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Fetch error: " + fullUrl);

    var doc = res.parse();

    // Title
    var title = "";
    var h1 = selFirst(doc, ".post-title h1, h1");
    if (h1) title = h1.text().trim();

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".summary_image img[data-src], .summary_image img[data-lazy-src], .summary_image img[src]");
    if (!coverEl) coverEl = selFirst(doc, ".tab-summary img[data-src], .tab-summary img[src]");
    if (!coverEl) coverEl = selFirst(doc, "img.wp-post-image[data-src], img.wp-post-image[src]");
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("data-lazy-src") || coverEl.attr("src") || "";
        if (cover.indexOf("data:") === 0) cover = "";
    }

    // Author
    var author = "";
    var authorEl = selFirst(doc, ".author-content a, .artist-content a");
    if (authorEl) {
        author = authorEl.text().trim();
    } else {
        // Try fallback with text content
        var postContent = doc.select(".post-content_item, .post-content .summary-content");
        for (var i = 0; i < postContent.size(); i++) {
            var item = postContent.get(i);
            var label = selFirst(item, ".summary-heading, h5");
            if (label && label.text().indexOf("Tác giả") !== -1) {
                var val = selFirst(item, ".summary-content, .artist-content");
                if (val) author = val.text().trim();
                break;
            }
        }
    }
    if (!author || author === "Chưa có thông tin") author = "Kuro Trans";

    // Status
    var status = "";
    var statusItems = doc.select(".post-status .summary-content, .post-content_item");
    for (var j = 0; j < statusItems.size(); j++) {
        var txt = statusItems.get(j).text();
        if (txt.indexOf("Ongoing") !== -1 || txt.indexOf("ongoing") !== -1) {
            status = "Ongoing";
            break;
        }
        if (txt.indexOf("Completed") !== -1 || txt.indexOf("completed") !== -1) {
            status = "Completed";
            break;
        }
    }
    if (!status) {
        var bodyText = doc.text();
        if (bodyText.indexOf("Completed") !== -1) status = "Completed";
        else if (bodyText.indexOf("Ongoing") !== -1) status = "Ongoing";
    }

    // Genres
    var genres = [];
    var genreLinks = doc.select(".genres-content a, a[href*='/the-loai/']");
    var seenGenre = {};
    for (var k = 0; k < genreLinks.size(); k++) {
        var g = genreLinks.get(k).text().trim();
        if (g && !seenGenre[g]) {
            seenGenre[g] = true;
            genres.push(g);
        }
    }

    // Description
    var desc = "";
    var descEl = selFirst(doc, ".description-summary .summary__content, .summary__content, .description-summary");
    if (descEl) {
        desc = descEl.text().trim();
    }
    // Fallback: look for Tóm tắt section
    if (!desc) {
        var allText = doc.text();
        var tomTatIdx = allText.indexOf("Tóm tắt:");
        if (tomTatIdx !== -1) {
            var endIdx = allText.indexOf("Chú thích", tomTatIdx);
            if (endIdx === -1) endIdx = allText.indexOf("📚", tomTatIdx);
            if (endIdx === -1) endIdx = Math.min(tomTatIdx + 500, allText.length);
            desc = allText.substring(tomTatIdx + 8, endIdx).trim();
        }
    }

    var result = {
        title: title,
        cover: cover,
        author: author,
        status: status,
        genre: genres.join(", "),
        description: desc,
        url: fullUrl
    };

    return Response.success(result);
}
