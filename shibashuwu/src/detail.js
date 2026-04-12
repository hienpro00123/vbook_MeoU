load("config.js");

function execute(url) {
    try {
        var fullUrl = resolveUrl(url);

        var doc = null;
        var res = fetchRetry(fullUrl);
        if (res && res.ok) {
            doc = res.html();
        }

        if (!doc) {
            doc = fetchBrowser(fullUrl, 15000);
        }

        if (!doc) {
            return Response.error("Fetch failed: " + fullUrl);
        }

        var titleEl = selFirst(doc, "h1 a[href*='/book/'], h1");
        var title = titleEl ? cleanText(titleEl.text()) : "";
        if (!title) {
            return Response.error("No title found in page");
        }

        var lowerTitle = title.toLowerCase();
        if (lowerTitle.indexOf("404") !== -1 || lowerTitle.indexOf("not found") !== -1) {
            return Response.error("404 page: " + title);
        }

        var authorA = selFirst(doc, "a[href*='/writer/']");
        var author = authorA ? cleanText(authorA.text()) : "Unknown";

        var categoryA = null;
        var links = doc.select("a[href]");
        for (var i = 0; i < links.size(); i++) {
            var link = links.get(i);
            var href = resolveUrl(link.attr("href") || "");
            if (CATEGORY_LINK_RE.test(href)) {
                categoryA = link;
                break;
            }
        }

        var descEl = selFirst(doc, "h3:matchesOwn(内容简介) + p");
        var description = descEl ? cleanText(descEl.text()) : "";

        var updateText = "";
        var paragraphs = doc.select("p");
        for (var pi = 0; pi < paragraphs.size(); pi++) {
            var text = cleanText(paragraphs.get(pi).text());
            if (text.indexOf("更新时间：") === 0) {
                updateText = text;
                break;
            }
        }

        var detailParts = [];
        if (categoryA) detailParts.push("类别: " + cleanText(categoryA.text()));
        if (updateText) detailParts.push(updateText);
        detailParts.push("内容分级: 18+");

        var genres = [];
        if (categoryA) {
            var genre = buildGenre(categoryA.text(), categoryA.attr("href"));
            if (genre) genres.push(genre);
        }

        return Response.success({
            name: adultName(title),
            cover: extractCover(doc),
            host: HOST,
            author: author,
            description: description,
            detail: detailParts.join("\n"),
            ongoing: true,
            genres: genres,
            suggests: collectSuggests(doc, fullUrl),
            comments: []
        });
    } catch (ex) {
        return Response.error("Error: " + ex);
    }
}
