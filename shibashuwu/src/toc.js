load("config.js");

function parsePage(doc, chapters, seen) {
    var links = doc.select("a[href*='/book/']");
    for (var i = 0; i < links.size(); i++) {
        var link = links.get(i);
        var href = resolveUrl(link.attr("href") || "");
        if (!CHAPTER_RE.test(href) || seen[href]) continue;

        var name = cleanText(link.text());
        if (!name) continue;

        seen[href] = true;
        chapters.push({
            name: name,
            url: href,
            host: HOST
        });
    }
}

function execute(url) {
    var storyUrl = resolveUrl(url);
    if (storyUrl.charAt(storyUrl.length - 1) !== "/") storyUrl += "/";

    var firstRes = fetchRetry(storyUrl + "catalog/");
    if (!firstRes || !firstRes.ok) {
        return Response.error("Khong tai duoc muc luc");
    }

    var firstDoc = firstRes.html();
    var chapters = [];
    var seen = {};
    parsePage(firstDoc, chapters, seen);

    var lastPage = 1;
    var tailA = selFirst(firstDoc, "a:matchesOwn(尾页)");
    if (tailA) {
        var tailHref = resolveUrl(tailA.attr("href") || "");
        var match = /\/catalog\/(\d+)\.html$/.exec(tailHref);
        if (match) lastPage = parseInt(match[1], 10);
    }

    for (var page = 2; page <= lastPage; page++) {
        var res = fetchRetry(storyUrl + "catalog/" + page + ".html");
        if (!res || !res.ok) break;
        parsePage(res.html(), chapters, seen);
    }

    return Response.success(chapters);
}
