load("config.js");

function parseAjaxChapters(html, seen, result) {
    var parts = ("" + html).split("chapter-item");
    for (var k = 1; k < parts.length; k++) {
        var p = parts[k];
        var hi = p.indexOf('href="');
        if (hi < 0) continue;
        var he = p.indexOf('"', hi + 6);
        if (he < 0) continue;
        var href = p.substring(hi + 6, he);
        if (!href || seen[href]) continue;

        var h3i = p.indexOf("<h3>");
        if (h3i < 0) continue;
        var h3e = p.indexOf("</h3>", h3i);
        if (h3e < 0) continue;
        var name = p.substring(h3i + 4, h3e).replace(/\s+/g, " ").trim();
        if (!name) continue;

        seen[href] = true;
        result.push({ name: adultName(name), url: href, host: HOST });
    }
}

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc danh sach chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc trang truyen");

    var chapters = [];
    var seen = {};

    var links = doc.select("a.chapter-item");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        if (seen[href]) continue;
        seen[href] = true;

        var nameEl = selFirst(a, "h3");
        var name = nameEl ? nameEl.text().replace(/\s+/g, " ").trim() : "";
        if (!name) continue;
        chapters.push({ name: adultName(name), url: href, host: HOST });
    }

    var renderEl = selFirst(doc, "#chapter-list-render");
    var slug = renderEl ? renderEl.attr("data-slug") : extractSlug(url);
    if (!slug && chapters.length > 0) {
        slug = extractSlug(chapters[0].url);
    }

    if (slug) {
        for (var offset = chapters.length > 0 ? chapters.length : 20; offset < 2000; offset += 20) {
            var apiUrl = BASE_URL + "/load-more-chapters?slug=" + slug
                + "&offset=" + offset + "&sortByPosition=desc";
            var ajaxRes = fetch(apiUrl, FETCH_OPTIONS);
            if (!ajaxRes || !ajaxRes.ok) break;
            var data;
            try { data = ajaxRes.json(); } catch (e) { break; }
            if (!data || !data.html) break;
            var before = chapters.length;
            parseAjaxChapters(data.html, seen, chapters);
            if (chapters.length === before) break;
            if (!data.has_more) break;
        }
    }

    if (chapters.length === 0) return Response.error("Khong tim thay danh sach chuong");

    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }
    return Response.success(reversed);
}

