var BASE_URL = "https://valvrareteam.net";

var ID_RE = /__ID__([0-9a-fA-F]{24})/;
var CID_RE = /__CHAPID__([0-9a-fA-F]{24})/;

function extractNovelId(url) { var m = ID_RE.exec(url); return m ? m[1] : null; }
function extractChapId(url) { var m = CID_RE.exec(url); return m ? m[1] : null; }

function makeNovelUrl(id) { return BASE_URL + "/truyen/__ID__" + id; }
function makeChapUrl(nid, cid) { return BASE_URL + "/truyen/__ID__" + nid + "/chuong/__CHAPID__" + cid; }
function shortId(id) { return id.substring(id.length - 8); }

function mapStatus(s) {
    if (s === "Ongoing") return "Đang tiến hành";
    if (s === "Completed") return "Hoàn thành";
    if (s === "Hiatus") return "Tạm ngưng";
    return s || "";
}

function fetchJson(url) {
    var res = fetch(url);
    if (res && res.ok) { try { return res.json(); } catch(e) {} }
    res = fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36", "Accept": "application/json" } });
    if (res && res.ok) { try { return res.json(); } catch(e) {} }
    return null;
}

function fetchApi(path) { return fetchJson(BASE_URL + path); }

function parseNovels(input, page) {
    var p = page ? parseInt(page) : 1;
    var data = fetchJson(input + "&page=" + p);
    if (!data || !data.novels) return Response.success([], null);
    var items = [];
    var novels = data.novels;
    for (var i = 0; i < novels.length; i++) {
        var n = novels[i];
        var ch = n.chapters || [];
        var latest = ch.length > 0 ? (ch[0].title || "") : "";
        items.push({ name: n.title || "", cover: n.illustration || "", link: makeNovelUrl(n._id), description: mapStatus(n.status) + (latest ? " | " + latest : "") });
    }
    var pg = data.pagination || {};
    return Response.success(items, (p < (pg.totalPages || 1)) ? (p + 1) : null);
}

function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ").replace(/&apos;/g,"'").replace(/&quot;/g,"\"").replace(/&#(\d+);/g, function(m, d) { return String.fromCharCode(parseInt(d,10)); }).trim();
}
