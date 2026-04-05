load("config.js");

// Regex trích link chương từ HTML fragment (AJAX response)
// Hỗ trợ cả href='...' và href="..." — một số server trả về double quotes
var CHAP_A_RE = /<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/g;

// Decode HTML entities trong tên chương (từ AJAX response)
function decodeEntities(s) {
    return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"').replace(/&#(\d+);/g, function(m, n) {
                return String.fromCharCode(parseInt(n, 10));
            });
}

function parseChapHtml(html, slug, seen, chapters) {
    var m;
    CHAP_A_RE.lastIndex = 0;
    while ((m = CHAP_A_RE.exec(html)) !== null) {
        var href = m[1];
        if (slug && href.indexOf("/" + slug + "/") === -1) continue;
        if (seen[href]) continue;
        var name = decodeEntities(m[2].trim());
        if (!name) continue;
        seen[href] = true;
        chapters.push({
            name: name,
            url: href.charCodeAt(0) !== 47 ? href : BASE_URL + href,
            host: HOST
        });
    }
}

function execute(url) {
    var storyUrl = resolveUrl(url);
    // TOC có chapter links + paging trong static HTML → HTTP trực tiếp
    var res = fetchRetry(storyUrl);
    if (!res.ok) return Response.error("Không tải được mục lục");
    var doc = res.html();
    if (!doc) return Response.error("Không tải được mục lục");

    var slug = storyUrl.replace(BASE_URL, "").replace(/^\//, "").replace(/\/$/, "");
    var chapters = [];
    var seen = {};

    // Parse chương từ HTML trang đầu
    // Phase 1: Specific selectors (fast — không scan toàn bộ anchors)
    var chapLinks = doc.select("#chapter-list a[href], .list-chapter a[href]");
    // Phase 2: Broad fallback chỉ khi specific không tìm thấy gì
    if (chapLinks.size() === 0) {
        chapLinks = doc.select("a[href*='/chuong-']");
    }
    for (var i = 0; i < chapLinks.size(); i++) {
        var a = chapLinks.get(i);
        var href = a.attr("href");
        if (!href || HASH_RE.test(href)) continue;
        if (slug && href.indexOf("/" + slug + "/") === -1) continue;
        if (seen[href]) continue;
        var fullHref = href.charCodeAt(0) !== 47 ? href : BASE_URL + href;
        var chapName = a.text().trim();
        if (!chapName) chapName = a.attr("title") || "";
        if (!chapName) continue;
        seen[href] = true;  // mark sau khi xác nhận tên hợp lệ
        chapters.push({ name: chapName, url: fullHref, host: HOST });
    }

    // Tìm bookId và tổng số trang từ paging section
    var bookId = null;
    var totalPages = 1;
    var pagingLinks = doc.select(".paging a[onclick]");
    for (var j = 0; j < pagingLinks.size(); j++) {
        var onclick = pagingLinks.get(j).attr("onclick");
        if (!onclick) continue;
        var idMatch = /page\((\d+),(\d+)\)/.exec(onclick);
        if (idMatch) {
            if (!bookId) bookId = idMatch[1];
            var pn = parseInt(idMatch[2]);
            if (pn > totalPages) totalPages = pn;
        }
    }

    // Fetch các trang chương còn lại qua AJAX API
    if (bookId && totalPages > 1) {
        for (var p = 2; p <= totalPages && p <= 100; p++) {
            var pageRes = fetchRetry(BASE_URL + "/get/listchap/" + bookId + "?page=" + p);
            if (!pageRes.ok) break;
            var json;
            try { json = pageRes.json(); } catch (e) { break; }
            if (!json || !json.data) break;
            parseChapHtml(json.data, slug, seen, chapters);
        }
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");
    return Response.success(chapters);
}

