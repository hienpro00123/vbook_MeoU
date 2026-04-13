load("config.js");

var SKIP_RE = /^(Đọc|Từ đầu|Mới nhất|Xem thêm|Trang trước|Trang sau|Tải thêm)$/;

function getChapterName(linkEl) {
    var titleEl = selFirst(linkEl, "h3.uk-link-heading, .uk-link-heading, h3");
    if (titleEl) {
        var title = titleEl.text().replace(/\s+/g, " ").trim();
        if (title) return title;
    }

    var clone = linkEl.clone();
    clone.select(".uk-article-meta, time, .init-plugin-suite-view-count-views, .uk-icon, hr").remove();
    return clone.text().replace(/\s+/g, " ").trim();
}

function collectChapters(doc, chapters, seen) {
    var chapLinks = doc.select("a[href*='/chuong-']");
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href") || "";
        if (!href || href.indexOf("/chuong-") === -1) continue;
        if (seen[href]) continue;

        var cname = getChapterName(a);
        if (!cname || cname.length < 2) continue;
        if (SKIP_RE.test(cname)) continue;

        seen[href] = true;
        chapters.push({
            name: cname,
            url: href.replace(BASE_URL, ""),
            host: HOST
        });
    }
}

function getMaxChapterPage(doc) {
    var pagerLinks = doc.select("a[href*='/chuong/page/']");
    var maxPage = 1;
    for (var i = 0; i < pagerLinks.size(); i++) {
        var href = pagerLinks.get(i).attr("href") || "";
        var match = href.match(/\/chuong\/page\/(\d+)\//);
        if (!match) continue;
        var pageNum = parseInt(match[1], 10);
        if (pageNum > maxPage) maxPage = pageNum;
    }
    return maxPage;
}

function execute(url) {
    var detailUrl = resolveUrl(url);
    var doc = fetchDoc(detailUrl);
    if (!doc) return Response.error("");

    var chapters = [];
    var seen = {};
    collectChapters(doc, chapters, seen);

    var maxPage = getMaxChapterPage(doc);
    if (maxPage > 1) {
        var normalizedDetailUrl = detailUrl.replace(/\/+$/, "");
        for (var pageNum = 2; pageNum <= maxPage; pageNum++) {
            var pageUrl = normalizedDetailUrl + "/chuong/page/" + pageNum + "/";
            var pageDoc = fetchDoc(pageUrl);
            if (!pageDoc) continue;
            collectChapters(pageDoc, chapters, seen);
        }
    }

    // Reverse to get ascending order (chapter 1 first)
    var sorted = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        sorted.push(chapters[j]);
    }

    if (sorted.length === 0) return Response.error("");
    return Response.success(sorted);
}
