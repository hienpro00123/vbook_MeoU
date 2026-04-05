load("config.js");

var AUTHOR_SLUG_RE = /\/tac-gia\/([^\/]+)\/?/;

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung trang");

    // Tiêu đề
    var titleEl = selFirst(doc, ".post-title h1, h1.post-title, .manga-title h1, h1");
    var title = titleEl ? titleEl.text().trim() : "";

    // Cover
    var cover = "";
    var coverEl = selFirst(doc, ".summary_image img, .tab-summary img[data-src], .tab-summary img[src]");
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("data-lazy") || coverEl.attr("src") || "";
    }
    if (cover && cover.indexOf("http") !== 0) cover = BASE_URL + cover;

    // Tác giả
    var authorName = "";
    var authorLink = "";
    var authorEl = selFirst(doc, ".author-content a, .manga-authors a");
    if (authorEl) {
        authorName = authorEl.text().trim();
        var authorHref = authorEl.attr("href") || "";
        var aMatch = AUTHOR_SLUG_RE.exec(authorHref);
        if (aMatch) authorLink = "author:" + aMatch[1];
    }

    // Thể loại
    var genres = [];
    var genreEls = doc.select(".genres-content a[href*='/the-loai/'], .manga-genres a[href*='/the-loai/']");
    for (var gi = 0; gi < genreEls.size(); gi++) {
        var g = genreEls.get(gi).text().trim();
        if (g) genres.push(g);
    }

    // Tình trạng
    var status = "";
    var statusItems = doc.select(".post-content_item, .manga-status");
    for (var si = 0; si < statusItems.size(); si++) {
        var item = statusItems.get(si);
        var heading = selFirst(item, ".summary-heading, h5");
        if (heading && heading.text().indexOf("Tình trạng") !== -1) {
            var val = selFirst(item, ".summary-content, span");
            if (val) {
                status = val.text().trim();
                break;
            }
        }
    }
    if (!status) {
        var statusEl = selFirst(doc, ".post-status .summary-content, .manga-status span");
        if (statusEl) status = statusEl.text().trim();
    }

    // Mô tả
    var description = "";
    var descEl = selFirst(doc, ".manga-excerpt, .summary__content, .manga-summary, .description-summary");
    if (descEl) {
        // Lấy text từ các thẻ p
        var descPs = descEl.select("p");
        if (descPs.size() > 0) {
            var parts = [];
            for (var di = 0; di < descPs.size(); di++) {
                var t = descPs.get(di).text().trim();
                if (t) parts.push(t);
            }
            description = parts.join("\n");
        }
        if (!description) {
            description = descEl.text().trim();
        }
    }

    var result = {
        name: title,
        cover: cover,
        description: description,
        author: authorName,
        suggest: authorLink,
        extra: {
            "Thể loại": genres.join(", "),
            "Tình trạng": status
        }
    };

    return Response.success(result);
}
