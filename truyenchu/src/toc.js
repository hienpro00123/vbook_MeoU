load("config.js");

var POST_ID_RE = /\bpost-(\d+)\b/;
var CHAP_HREF_RE = /\/truyen\/[^\/]+\/chuong/;

// Parse chapter links từ HTML fragment (static hoặc AJAX response)
function parseChapLinks(container, seen, out) {
    var links = container.select(".wp-manga-chapter a[href], li.wp-manga-chapter a[href]");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || !CHAP_HREF_RE.test(href)) continue;
        if (href.indexOf("http") !== 0) href = BASE_URL + href;
        if (seen[href]) continue;
        seen[href] = true;
        var name = a.text().trim();
        if (!name) continue;
        out.push({ name: name, url: href, host: HOST });
    }
}

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung trang");

    var chapters = [];
    var seen = {};

    // Bước 1: Thử lấy chapter list từ static HTML
    var chapWrap = selFirst(doc, ".listing-chapters_wrap, .chapters-container, #manga-reading-nav-head");
    if (!chapWrap) chapWrap = doc;
    parseChapLinks(chapWrap, seen, chapters);

    // Bước 2: Nếu không có → dùng AJAX (Madara Ajax-loaded chapters)
    if (chapters.length === 0) {
        // Lấy post ID từ class của <article> hoặc <div id="manga-chapters-holder">
        var postId = "";
        var articleEl = selFirst(doc, "article[class*='post-'], #manga-chapters-holder[data-id]");
        if (articleEl) {
            var dataId = articleEl.attr("data-id") || "";
            if (dataId) {
                postId = dataId;
            } else {
                var classAttr = articleEl.attr("class") || "";
                var m = POST_ID_RE.exec(classAttr);
                if (m) postId = m[1];
            }
        }

        if (postId) {
            var ajaxRes = fetch(BASE_URL + "/wp-admin/admin-ajax.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": storyUrl
                },
                body: "action=manga_get_chapters&manga=" + postId
            });
            if (ajaxRes && ajaxRes.ok) {
                var ajaxHtml = ajaxRes.html();
                if (ajaxHtml) parseChapLinks(ajaxHtml, seen, chapters);
            }
        }
    }

    if (chapters.length === 0) return Response.error("Không tìm thấy danh sách chương");

    // Danh sách trên trang là mới nhất trước → đảo ngược về chương 1 trước
    var reversed = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        reversed.push(chapters[j]);
    }

    return Response.success(reversed);
}
