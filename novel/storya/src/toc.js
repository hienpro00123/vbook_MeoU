load("config.js");

var TOC_CACHE_TTL = 300000;

function readCachedToc(key, slug) {
    var raw;
    try {
        raw = cacheStorage.getItem(key);
    } catch (e) {
        if (typeof Log !== "undefined") Log.log("Storya TOC cache read failed: " + e);
        return null;
    }
    if (!raw) return null;

    var cached;
    try {
        cached = JSON.parse(raw);
    } catch (e) {
        if (typeof Log !== "undefined") Log.log("Storya TOC cache is invalid: " + e);
        return null;
    }
    if (!cached || cached.expires <= Date.now() || !cached.chapters) return null;

    var prefix = SITE_PREFIX + "/stories/" + slug + "/";
    var chapters = [];
    for (var i = 0; i < cached.chapters.length; i++) {
        var item = cached.chapters[i];
        if (!item || typeof item[0] !== "string" || typeof item[1] !== "string") return null;
        chapters.push({
            name: item[1],
            url: prefix + item[0],
            host: HOST
        });
    }
    return chapters;
}

function writeCachedToc(key, chapters, slug) {
    var items = [];
    var prefix = SITE_PREFIX + "/stories/" + slug + "/";
    for (var i = 0; i < chapters.length; i++) {
        items.push([chapters[i].url.substring(prefix.length), chapters[i].name]);
    }
    try {
        cacheStorage.setItem(key, JSON.stringify({
            expires: Date.now() + TOC_CACHE_TTL,
            chapters: items
        }));
    } catch (e) {
        if (typeof Log !== "undefined") Log.log("Storya TOC cache write failed: " + e);
    }
}

function execute(url) {
    var slug = extractSlug(url);
    var cacheKey = "storya:toc:v1:" + slug;
    var cached = readCachedToc(cacheKey, slug);
    if (cached) return Response.success(cached);

    var chapters = [];
    var pagePath = SITE_PREFIX + "/stories/" + slug + "?order=asc";
    var seen = {};

    for (var page = 0; page < 100; page++) {
        var doc = fetchPage(pagePath);
        if (!doc) return Response.error("Không tải được mục lục Storya");

        var prefix = SITE_PREFIX + "/stories/" + slug + "/";
        var links = doc.select('a[href*="' + prefix + '"]');
        for (var i = 0; i < links.size(); i++) {
            var link = links.get(i);
            var href = link.attr("href");
            if (href.indexOf(prefix) !== 0) continue;
            var chapterSlug = href.substring(prefix.length).split(/[?#]/)[0];
            if (!chapterSlug || chapterSlug.indexOf("/") >= 0 || /\.xml$/i.test(chapterSlug) || seen[chapterSlug]) continue;

            var titleParts = link.select("span");
            var title = titleParts.size() > 0 ? titleParts.get(0).text() : link.text();
            if (/^(Đọc từ đầu|Chương mới nhất)$/i.test(title.trim())) continue;
            if (!title) title = "Chương " + (chapters.length + 1);
            seen[chapterSlug] = true;
            chapters.push({
                name: title,
                url: href,
                host: HOST
            });
        }

        var next = doc.select('a[rel="next"]');
        if (next.isEmpty()) break;
        pagePath = next.get(0).attr("href");
        if (!pagePath) break;
    }

    writeCachedToc(cacheKey, chapters, slug);
    return Response.success(chapters);
}
