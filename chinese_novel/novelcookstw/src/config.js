var BASE_URL = DOMAIN || "https://novel.cooks.tw";
var API_BASE = BASE_URL + "/api";
var API_TIMEOUT = 25000;
var API_CACHE_TTL = 30000;
var PIC_BASE = "https://pic.cooks.tw";

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    "Referer": BASE_URL + "/",
    "Origin": BASE_URL
};

function apiUrl(path) {
    var sep = path.indexOf("?") >= 0 ? "&" : "?";
    return API_BASE + path + sep + "lang=zh-TW";
}

function parseJson(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

// Phát hiện trang Cloudflare JS Challenge (chỉ dùng khi body không phải JSON)
function isCloudflareChallenge(text) {
    if (!text) return false;
    var sample = text.substring(0, 4000).toLowerCase();
    if (sample.indexOf("just a moment") >= 0) return true;
    if (sample.indexOf("attention required") >= 0) return true;
    if (sample.indexOf("cf-chl") >= 0) return true;
    if (sample.indexOf("you have been blocked") >= 0) return true;
    return sample.indexOf("cloudflare") >= 0 && sample.indexOf("ray id") >= 0;
}

function fetchOnce(url) {
    var res = null;
    try {
        res = fetch(url, { headers: FETCH_HEADERS, timeout: API_TIMEOUT });
    } catch (e) {
        return { error: "Không kết nối được máy chủ", status: 0, retryable: true };
    }
    if (!res) return { error: "Không kết nối được máy chủ", status: 0, retryable: true };

    if (!res.ok) {
        var status = res.status;
        var errorText = "";
        try {
            errorText = res.text();
        } catch (e2) {}
        var isCloudflare = isCloudflareChallenge(errorText);
        if (!isCloudflare && typeof res.header === "function") {
            var server = res.header("server") || "";
            isCloudflare = String(server).toLowerCase().indexOf("cloudflare") >= 0;
        }
        return {
            error: isCloudflare ? "Cloudflare chặn truy cập (HTTP " + status + ")" : "HTTP " + status,
            status: status,
            retryable: isCloudflare || status === 0 || status >= 500,
            cf: isCloudflare
        };
    }

    var text = "";
    try {
        text = res.text();
    } catch (e2) {
        text = "";
    }

    var json = parseJson(text);
    if (json) return { json: json };

    if (isCloudflareChallenge(text)) {
        return { error: "Cloudflare chặn truy cập (HTTP " + res.status + ")", status: res.status, retryable: true, cf: true };
    }
    return { error: "Phản hồi không phải JSON (HTTP " + res.status + ")", status: res.status, retryable: false };
}

// Fallback WebView: vượt Cloudflare JS challenge rồi lấy JSON qua XHR đồng bộ
function fetchApiViaBrowser(url) {
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 20000);
        var script = "(function(){var x=new XMLHttpRequest();x.open('GET'," + JSON.stringify(url) + ",false);x.send();return JSON.stringify({status:x.status,body:x.responseText});})()";
        var raw = null;
        try {
            raw = browser.callJs(script, 10000);
        } catch (e) {
            raw = null;
        }
        if (!raw) {
            try {
                browser.html(5000);
            } catch (e2) {}
            try {
                raw = browser.callJs(script, 10000);
            } catch (e3) {
                raw = null;
            }
        }
        var response = parseJson(raw);
        if (!response || typeof response.status !== "number" || response.status < 200 || response.status >= 300) return null;
        return parseJson(response.body);
    } catch (e) {
        return null;
    } finally {
        if (browser) {
            try {
                browser.close();
            } catch (e4) {}
        }
    }
}

function getCachedApiResult(key) {
    try {
        var cached = parseJson(cacheStorage.getItem(key));
        if (cached && cached.expires > Date.now() && cached.json && cached.json.code === 200) {
            return { json: cached.json };
        }
    } catch (e) {
        if (typeof Log !== "undefined") Log.log("NovelCooksTW cache read failed: " + e);
        return null;
    }
    return null;
}

function cacheApiResult(key, result) {
    if (!result || !result.json || result.json.code !== 200) return;
    try {
        cacheStorage.setItem(key, JSON.stringify({
            expires: Date.now() + API_CACHE_TTL,
            json: result.json
        }));
    } catch (e) {
        if (typeof Log !== "undefined") Log.log("NovelCooksTW cache write failed: " + e);
    }
}

// Trả về { json } hoặc { error, status, cf }
function fetchApi(path, useCache) {
    var url = apiUrl(path);
    var cacheKey = "novelcookstw:" + url;
    if (useCache) {
        var cached = getCachedApiResult(cacheKey);
        if (cached) return cached;
    }

    var result = fetchOnce(url);
    if (result.json) {
        if (useCache) cacheApiResult(cacheKey, result);
        return result;
    }

    if (result.retryable && !result.cf) result = fetchOnce(url);
    if (result.json) {
        if (useCache) cacheApiResult(cacheKey, result);
        return result;
    }

    if (result.cf || result.status === 0) {
        var viaBrowser = fetchApiViaBrowser(url);
        if (viaBrowser) {
            result = { json: viaBrowser };
            if (useCache) cacheApiResult(cacheKey, result);
            return result;
        }
    }
    return result;
}

function coverUrl(id) {
    var n = parseInt(id, 10);
    if (!n) return "";
    var sub = Math.floor(n / 1000);
    return PIC_BASE + "/" + sub + "/" + n + "/" + n + "s.webp";
}

function makeChapUrl(articleId, chapterId) {
    return BASE_URL + "/reader.html?articleid=" + articleId + "&chapterid=" + chapterId;
}

function parseArticleId(url) {
    var m = url.match(/[?&]articleid=(\d+)/);
    return m ? m[1] : null;
}

function parseChapterId(url) {
    var m = url.match(/[?&]chapterid=(\d+)/);
    return m ? m[1] : null;
}

function buildItems(items, limit) {
    var result = [];
    if (!items) return result;
    var len = (limit && limit < items.length) ? limit : items.length;
    for (var i = 0; i < len; i++) {
        var n = items[i];
        if (!n) continue;
        var id = n.articleid || n.my_novel_id;
        var name = n.articlename || n.title || "";
        if (!id || !name) continue;
        result.push({
            name: name,
            link: BASE_URL + "/novel.html?articleid=" + id,
            host: BASE_URL,
            cover: coverUrl(id),
            description: n.intro || n.author || ""
        });
    }
    return result;
}

function textToHtml(text) {
    if (!text) return "";
    var lines = text.split(/\r?\n/);
    var html = "";
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line) html += "<p>" + line + "</p>";
    }
    return html;
}
