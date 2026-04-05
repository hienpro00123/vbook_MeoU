load("config.js");

// =============================================================
// BIXIANGE CHAP.JS — Trích xuất nội dung chương
// =============================================================
// DOM structure (m.bixiange.me):
//   #mycontent chứa TẤT CẢ — bao gồm:
//     <p>Tên truyện</p>
//     <p>作者：Tác giả</p>
//     <p>简介：</p>
//     <p>　　Synopsis line 1</p>
//     ...
//     <p></p>              ← dòng trống phân cách
//     <p>Tên phần/quyển</p>
//     <p></p>              ← dòng trống
//     <p> Chương X: ...</p>  ← tiêu đề chương
//     <p>　　Nội dung...</p>  ← chapter content bắt đầu
//     ...
//   KHÔNG có .content sub-div — tất cả <p> nằm trực tiếp trong #mycontent
//
// Chiến lược: tìm vị trí bắt đầu chapter text, skip synopsis phía trước
// =============================================================

var PROMO_RE = /本书由|提供下载|最新章节|手机用户|一秒钟记住|请记住|本站网址|章节错误|内容更新|本章字数|正文字数|分享本书|点击右上角|阅读全文|www\.|\.net|\.com|\.me|bixiange|笔仙阁|全文免费|免费阅读|作者有话|下载地址|最新站点/i;

// Nhận diện tiêu đề chương: "第X章", "第X节", "Chapter X", hoặc "第X回"
var CHAP_TITLE_RE = /^[\s\u3000]*(第[\d一二三四五六七八九十百千万零〇]+[章节回]|chapter\s*\d)/i;

// Nhận diện metadata: tên sách, tác giả, giới thiệu
var META_RE = /^(作者[：:]|简介[：:]?$)/;

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

// Tìm vị trí bắt đầu nội dung chương trong mảng <p>
// 3 phương pháp: (1) tìm tiêu đề chương, (2) tìm sau "简介" + nội dung synopsis, (3) default=0
function findChapterStart(paras) {
    // Phương pháp 1: tìm <p> chứa tiêu đề chương (第X章/节)
    for (var i = 0; i < paras.size(); i++) {
        var txt = paras.get(i).text().trim();
        if (CHAP_TITLE_RE.test(txt)) return i;
    }
    // Phương pháp 2: tìm "简介" rồi skip qua synopsis (các <p> bắt đầu bằng 　　 sau 简介)
    // Chapter content bắt đầu sau dòng trống cuối cùng của phần synopsis
    var foundSynopsis = false;
    var lastEmptyAfterSynopsis = -1;
    for (var j = 0; j < paras.size(); j++) {
        var t = paras.get(j).text().trim();
        if (t === "\u7B80\u4ECB\uFF1A" || t === "\u7B80\u4ECB") { // 简介： hoặc 简介
            foundSynopsis = true;
            continue;
        }
        if (foundSynopsis) {
            if (!t) {
                lastEmptyAfterSynopsis = j;
            } else if (lastEmptyAfterSynopsis > 0 && t.length > 3) {
                // Tìm thấy text thực sau dòng trống → đây là bắt đầu chapter
                return lastEmptyAfterSynopsis + 1;
            }
        }
    }
    // Phương pháp 3: tìm "作者" → skip đến sau metadata
    for (var k = 0; k < paras.size() && k < 5; k++) {
        var mt = paras.get(k).text().trim();
        if (META_RE.test(mt)) {
            // Đây là metadata → chapter content ở phía sau xa hơn
            // Tìm dòng trống đầu tiên sau đây
            for (var m = k + 1; m < paras.size(); m++) {
                if (!paras.get(m).text().trim()) return m + 1;
            }
        }
    }
    return 0; // Không tìm thấy marker → lấy toàn bộ
}

function findContent(doc) {
    removeNoise(doc);

    // Ưu tiên: lấy #mycontent (ID cụ thể của bixiange)
    var el = selFirst(doc, "#mycontent");
    if (!el) {
        // Fallback selectors
        el = selFirst(doc, "#BookText, .booktext, #nr, .nr, #read_content, .readcont, #content, #chaptercontent, .chaptercontent, .read-content, .reading-content, .chapter-content, article");
    }
    if (!el) return "";

    el.select("a").remove();
    var paras = el.select("p");

    if (paras.size() < 2) {
        // Không có <p> → fallback stripHtml
        var raw = stripHtml(el.html());
        return raw.length > 100 ? raw : "";
    }

    // Tìm vị trí bắt đầu chapter (skip title/author/synopsis)
    var startIdx = findChapterStart(paras);

    var parts = [];
    for (var i = startIdx; i < paras.size(); i++) {
        var ptxt = paras.get(i).text().replace(/^\u3000+/, "").trim();
        if (!ptxt) continue;
        if (ptxt.length < 2) continue;
        if (PROMO_RE.test(ptxt)) continue;
        parts.push("\u3000\u3000" + ptxt);
    }

    return parts.join("\n\n");
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

    var maxPage = detectChapPages(doc, chapPath);
    var content = findContent(doc);

    for (var p = 2; p <= maxPage && p <= 5; p++) {
        var pageUrl = BASE_URL + chapPath + "_" + p + ".html";
        var pageDoc = fetchBrowser(pageUrl, 8000);
        if (!pageDoc) break;
        var pc = findContent(pageDoc);
        if (pc) content = content + "\n\n" + pc;
    }

    if (!content || content.length < 50) return Response.error("Khong tim thay noi dung chuong");
    return Response.success(content);
}
