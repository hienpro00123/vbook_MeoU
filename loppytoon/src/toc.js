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
    var slug = extractSlug(url);
    if (!slug) return Response.error("Khong xac dinh duoc truyen");

    var chapters = [];
    var seen = {};

    for (var offset = 0; offset < 2000; offset += 20) {
        var apiUrl = BASE_URL + "/load-more-chapters?slug=" + slug
            + "&offset=" + offset + "&sortByPosition=desc";
        var res = fetch(apiUrl, FETCH_OPTIONS);
        if (!res || !res.ok) break;
        var data;
        try { data = res.json(); } catch (e) { break; }
        if (!data || !data.html) break;
        var before = chapters.length;
        parseAjaxChapters(data.html, seen, chapters);
        if (chapters.length === before) break;
        if (!data.has_more) break;
    }

    if (chapters.length === 0) return Response.error("Khong tim thay danh sach chuong");

    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }
    return Response.success(reversed);
}

