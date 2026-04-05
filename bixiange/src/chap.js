load("config.js");

// BUG FIX: #mycontent là outer div chứa CẢ synopsis + chapter text
// Chapter text thực sự nằm trong #mycontent .content (sub-element)
// Không dùng "#mycontent" trực tiếp — sẽ lấy cả title/author/synopsis
var CHAP_CSS = "#mycontent .content, #mycontent div.content, " +
    "#BookText, .booktext, #nr, .nr, #read_content, .readcont, " +
    "#content, #chaptercontent, .chaptercontent, " +
    ".read-content, .reading-content, .chapter-content, " +
    "#article-content, .article-content, " +
    "article.reader-main, article";

var PROMO_LINE_RE = /本书由|提供下载|最新章节|手机用户|一秒钟记住|请记住|本站网址|章节错误|内容更新|本章字数|正文字数|分享本书|点击右上角|阅读全文|www\.|\.net|\.com|\.me|bixiange|笔仙阁|全文免费|免费阅读|作者有话|下载地址|最新站点/i;

var SEPARATOR_RE = /^[^\u4e00-\u9fff\u3400-\u4dbf\w\d]+$/;

function addIndent(text) {
    var lines = text.split("\n");
    var out = [];
    var prev = false;
    for (var i = 0; i < lines.length; i++) {
        var t = lines[i].replace(/^[ \t]+/, "").replace(/[ \t]+$/, "");
        if (!t) { if (prev) { out.push(""); prev = false; } continue; }
        if (PROMO_LINE_RE.test(t)) continue;
        if (SEPARATOR_RE.test(t)) { out.push(t); prev = false; continue; }
        if (prev) out.push("");
        out.push(t.charAt(0) === "\u3000" ? t : "\u3000\u3000" + t);
        prev = true;
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function removeNoise(doc) {
    doc.select("script, style, ins, iframe").remove();
    doc.select(".advert, .advertisement, [class*=advert], [id*=advert]").remove();
    doc.select("[class*='ads'], [id*='ads']").remove();
    doc.select(".chapter-footer, .chapter-header, .readBtn, .bottem, .bottom, .top, .chapter-nav, .read-nav").remove();
}

function detectChapPages(doc, chapPath) {
    var maxPage = 1;
    var links = doc.select("a[href*='" + chapPath + "_']");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = /_(\d+)\.html/.exec(href);
        if (m) {
            var n = parseInt(m[1], 10);
            if (n > maxPage) maxPage = n;
        }
    }
    return maxPage;
}

function findContent(doc) {
    removeNoise(doc);
    var el = selFirst(doc, CHAP_CSS);
    if (el) {
        el.select("a").remove();
        var paras = el.select("p");
        if (paras.size() > 0) {
            var parts = [];
            for (var i = 0; i < paras.size(); i++) {
                // Dùng .text() thay vì stripHtml(html) — lấy text thuần, tránh nested tags
                var ptxt = paras.get(i).text().replace(/^\u3000+/, "").trim();
                if (!ptxt || ptxt.length < 2 || PROMO_LINE_RE.test(ptxt)) continue;
                parts.push("\u3000\u3000" + ptxt);
            }
            if (parts.length > 0) {
                var joined = parts.join("\n\n");
                if (joined.length > 100) return joined;
            }
        }
        // Fallback: stripHtml toàn bộ HTML element (cho trang dùng <br> thay <p>)
        var txt = addIndent(stripHtml(el.html()));
        if (txt.length > 100) return txt;
    }
    // Final fallback: tìm div có text dài nhất, tỉ lệ link thấp
    var divs = doc.select("div[class], div[id]");
    var best = null;
    var bestLen = 200;
    for (var i = 0; i < divs.size(); i++) {
        var d = divs.get(i);
        var tLen = d.text().length;
        if (tLen <= bestLen) continue;
        var lLen = d.select("a").text().length;
        if (lLen > tLen * 0.4) continue;
        bestLen = tLen;
        best = d;
    }
    return best ? addIndent(stripHtml(best.html())) : "";
}

function execute(url) {
    var chapUrl = resolveUrl(url);

    var chapPath = chapUrl.replace(BASE_URL, "")
                          .replace(/\.html$/, "")
                          .replace(/_\d+$/, "");

    var doc = fetchBrowser(chapUrl);
    if (!doc) {
        var res = fetchRetry(chapUrl);
        if (!res || !res.ok) return Response.error("Khong the tai chuong");
        doc = res.html();
        if (!doc) return Response.error("Khong the tai chuong");
    }

    // Phát hiện số trang TRƯỚC removeNoise (removeNoise xóa nav chứa page links)
    var maxPage = detectChapPages(doc, chapPath);
    var content = findContent(doc);

    for (var p = 2; p <= maxPage && p <= 5; p++) {
        var pageUrl = BASE_URL + chapPath + "_" + p + ".html";
        var pageDoc = fetchBrowser(pageUrl, 8000);
        if (!pageDoc) break;
        var pageContent = findContent(pageDoc);
        if (pageContent) content = content + "\n\n" + pageContent;
    }

    if (!content || content.length < 50) return Response.error("Khong tim thay noi dung chuong");
    return Response.success(content);
}
