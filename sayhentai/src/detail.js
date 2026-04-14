load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Khong tai duoc truyen");

    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc thong tin truyen");

    var name = normalizeSpace(doc.select("h1").text());
    var coverEl = selectFirst(doc, ".summary_image img, .summary_image img.img-responsive, .post-thumb img");
    var cover = coverEl ? resolveImageUrl(coverEl.attr("data-src") || coverEl.attr("src") || "") : "";

    var author = normalizeSpace(doc.select(".author-content").text());
    var descEl = selectFirst(doc, ".description-summary p, .description-summary");
    var description = descEl ? normalizeSpace(descEl.text()) : "";

    var metaEls = doc.select(".post-content_item .summary-content, .post-content_item .summary-content-right, .summary-content");
    var detailParts = [];
    var seen = {};
    for (var i = 0; i < metaEls.size(); i++) {
        var text = normalizeSpace(metaEls.get(i).text());
        if (!text || seen[text]) continue;
        seen[text] = true;
        detailParts.push(text);
    }
    if (author && !seen["Author: " + author]) {
        detailParts.unshift("Author: " + author);
    }
    var detail = detailParts.join("<br>");

    var statusText = normalizeSpace(doc.select(".post-status .summary-content, .post-status").text());
    var statusValue = (statusText || detail).toLowerCase();
    var ongoing = !(statusValue.indexOf("full") >= 0 || statusValue.indexOf("completed") >= 0 || statusValue.indexOf("hoan thanh") >= 0);

    return Response.success({
        name: name,
        cover: cover,
        author: author || "SayHentai",
        description: description,
        detail: detail,
        genres: collectDetailGenres(doc),
        host: HOST,
        ongoing: ongoing
    });
}