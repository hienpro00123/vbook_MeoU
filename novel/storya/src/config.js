var HOST = "https://www.storya.click";
var SITE_PREFIX = "/vi";
var STORY_PATH_RE = /^\/vi\/stories\/([^\/?#]+)$/;

function extractSlug(url) {
    var match = /\/(?:vi\/)?stories\/([^\/?#]+)/.exec(url);
    if (match) return match[1];
    return url.replace(/^\/+/, "").replace(/\/+$/, "");
}

function fetchPage(path) {
    var url = path;
    if (url.indexOf("http") !== 0) {
        url = HOST + (url.charAt(0) === "/" ? url : "/" + url);
    }
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml"
        }
    });
    if (!response || !response.ok) return null;
    return response.html();
}

function resolveUrl(url) {
    if (!url) return "";
    if (url.indexOf("http") === 0) return url;
    return HOST + (url.charAt(0) === "/" ? url : "/" + url);
}

function parseStories(doc) {
    if (!doc) return [];
    var links = doc.select('a[href*="/vi/stories/"]');
    var stories = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var link = links.get(i);
        var href = link.attr("href");
        var match = STORY_PATH_RE.exec(href);
        if (!match || seen[match[1]]) continue;
        seen[match[1]] = true;

        var name = link.select("h2").text() || link.select("h3").text();
        if (!name) name = link.select("img").attr("alt") || link.text();
        var image = link.select("img");
        var cover = image.attr("src");
        var srcset = image.attr("srcset");
        if (srcset) {
            var firstSource = srcset.split(",")[0].trim().split(/\s+/)[0];
            if (firstSource) cover = firstSource;
        }
        var description = link.select("p").text();
        stories.push({
            name: name,
            link: href,
            host: HOST,
            cover: resolveUrl(cover),
            description: description
        });
    }
    return stories;
}

function getNextPage(doc) {
    if (!doc) return null;
    var next = doc.select('a[rel="next"]');
    if (next.isEmpty()) return null;
    var href = next.get(0).attr("href");
    var match = /[?&]page=(\d+)/.exec(href);
    return match ? match[1] : null;
}
