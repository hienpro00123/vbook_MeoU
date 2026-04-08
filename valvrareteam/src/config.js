var API_BASE = "https://val-ssr-2kzit.ondigitalocean.app";
var SITE_URL = "https://valvrareteam.net";
var NOVEL_ID_PREFIX = "__ID__";
var CHAP_ID_PREFIX = "__CHAPID__";

// Regex trích xuất MongoDB ObjectId (24 hex) từ virtual URL
var NOVEL_URL_RE = /__ID__([0-9a-fA-F]{24})/;
var CHAP_URL_RE = /__CHAPID__([0-9a-fA-F]{24})/;

function extractNovelId(url) {
    var m = NOVEL_URL_RE.exec(url);
    return m ? m[1] : null;
}

function extractChapId(url) {
    var m = CHAP_URL_RE.exec(url);
    return m ? m[1] : null;
}

function makeNovelUrl(novelId) {
    return SITE_URL + "/truyen/" + NOVEL_ID_PREFIX + novelId;
}

function makeChapUrl(chapterId) {
    return SITE_URL + "/chuong/" + CHAP_ID_PREFIX + chapterId;
}

function mapStatus(status) {
    if (status === "Ongoing") return "Đang tiến hành";
    if (status === "Completed") return "Hoàn thành";
    if (status === "Hiatus") return "Tạm ngưng";
    return status || "";
}

function fetchApi(path) {
    var url = API_BASE + path;
    var res = fetch(url);
    if (res && res.ok) return res;
    // Retry với headers
    res = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
            "Accept": "application/json"
        }
    });
    if (!res || !res.ok) return null;
    return res;
}

// Lấy phần text ngắn (strip HTML tags) cho description
function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ").replace(/&apos;/g,"'").replace(/&quot;/g,"\"").replace(/&#(\d+);/g, function(m, d) { return String.fromCharCode(parseInt(d,10)); }).trim();
}
