var HOST = "https://storya.click";
var API = HOST + "/api/v1";
var SLUG_RE = /\/truyen\/([^\/\?]+)/;

function extractSlug(url) {
    var m = SLUG_RE.exec(url);
    return m ? m[1] : url.replace(/^\/+/, "").replace(/\/+$/, "");
}

function apiJson(path) {
    var url = API + path;
    var res = fetch(url);
    if (!res || !res.ok) {
        res = fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36", "Accept": "application/json" }
        });
    }
    if (!res || !res.ok) return null;
    try { return res.json(); } catch (e) { return null; }
}

function resolveCover(url) {
    if (!url) return "";
    return url.charAt(0) === 47 ? HOST + url : url;
}

function parseStories(arr) {
    var r = [];
    for (var i = 0; i < arr.length; i++) {
        var s = arr[i];
        r.push({
            name: s.title || "",
            link: "/truyen/" + s.slug,
            host: HOST,
            cover: resolveCover(s.coverUrl),
            description: s.author ? s.author.name : ""
        });
    }
    return r;
}
