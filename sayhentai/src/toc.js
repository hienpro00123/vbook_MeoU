load("config.js");

function execute(url) {
    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Khong tai duoc danh sach chuong");

    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc danh sach chuong");

    var links = doc.select("ul.box-list-chapter li a[href], .listing-chapters_wrap li a[href], .listing-chapters_wrap a[href]");
    var moreLinks = null;
    var moreEl = selectFirst(doc, ".c-chapter-readmore[data-ajax-url]");
    if (moreEl) {
        var moreUrl = moreEl.attr("data-ajax-url") || "";
        var view = moreEl.attr("data-view") || "";
        if (moreUrl && view) {
            moreUrl += (moreUrl.indexOf("?") >= 0 ? "&" : "?") + "view=" + view;
            var moreRes = fetchRetry(moreUrl);
            if (moreRes && moreRes.ok) {
                var moreDoc = moreRes.html();
                if (moreDoc) moreLinks = moreDoc.select("li.wp-manga-chapter a[href]");
            }
        }
    }

    var items = [];
    var seen = {};
    var linkGroups = [moreLinks, links];
    for (var group = 0; group < linkGroups.length; group++) {
        var groupLinks = linkGroups[group];
        if (!groupLinks) continue;
        for (var i = groupLinks.size() - 1; i >= 0; i--) {
            var a = groupLinks.get(i);
            var chapterUrl = resolveUrl(a.attr("href") || "");
            var name = normalizeSpace(a.text());
            if (!chapterUrl || !name || seen[chapterUrl]) continue;
            seen[chapterUrl] = true;
            items.push({
                name: name,
                url: chapterUrl,
                host: HOST
            });
        }
    }

    if (items.length === 0) return Response.error("Khong tim thay chuong nao");
    return Response.success(items);
}