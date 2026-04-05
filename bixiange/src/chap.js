load("config.js");

// Selector nội dung chương — bixiange DedeCMS trước (#mycontent là ID cụ thể trên m.bixiange.me), rồi generic fallback
var CHAP_CSS = "#mycontent, #BookText, .booktext, #nr, .nr, #read_content, .readcont, " +
    "#content, .content, #chaptercontent, .chaptercontent, " +
    ".read-content, .reading-content, .chapter-content, " +
    "#article-content, .article-content, .story-content, " +
    "article.reader-main, article, main";

// Regex nhận diện dòng phân cách thuần ký hiệu (——, ※※※, ......, ===, ---)
var SEPARATOR_RE = /^[^\u4e00-\u9fff\u3400-\u4dbf\w\d]+$/;

// Regex lọc dòng watermark/promo DedeCMS inject vào nội dung tiểu thuyết TQ
// Khớp dòng chứa: URL site, lời mời đọc, thông báo cập nhật, tên site, v.v.
var PROMO_LINE_RE = /本书由|提供下载|最新章节|手机用户|一秒钟记住|请记住|本站网址|章节错误|内容更新|本章字数|正文字数|分享本书|点击右上角|阅读全文|www\.|\.net|\.com|\.me|bixiange|笔仙阁|全文免费|免费阅读|作者有话|下载地址|最新站点/i;

// Thêm indent　　cho từng đoạn — chuẩn tiểu thuyết Trung Quốc
// Đảm bảo mỗi đoạn nội dung cách nhau 1 dòng trắng dù HTML dùng <br> hay <p>
function addIndent(text) {
    var lines = text.split("\n");
    var out = [];
    var prevContent = false;  // đoạn trước là nội dung hay không
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = line.replace(/^[ \t]+/, "").replace(/[ \t]+$/, "");
        if (!trimmed) {
            if (prevContent) { out.push(""); prevContent = false; }
            continue;
        }
        // Lọc dòng watermark/promo — không đưa vào output
        if (PROMO_LINE_RE.test(trimmed)) continue;
        // Dòng phân cách ký hiệu — giữ nguyên, không indent, không tính là nội dung
        if (SEPARATOR_RE.test(trimmed)) { out.push(trimmed); prevContent = false; continue; }
        // System messages 【…】 trong LitRPG/isekai — giữ nguyên, không indent
        if (trimmed.charAt(0) === "\u3010") {
            if (prevContent) out.push("");
            out.push(trimmed);
            prevContent = true;
            continue;
        }
        // Tiêu đề ngắn (≤5 ký tự) — giữ khoảng cách với đoạn liền trước/sau
        if (trimmed.length <= 5) {
            if (prevContent) out.push("");
            out.push(trimmed);
            prevContent = true;
            continue;
        }
        // Đoạn nội dung — chèn dòng trắng ngăn cách nếu đoạn trước cũng là nội dung
        if (prevContent) out.push("");
        if (trimmed.charAt(0) === "\u3000") {
            out.push(trimmed);
        } else {
            out.push("\u3000\u3000" + trimmed);
        }
        prevContent = true;
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Dọn noise (quảng cáo, script, style) trước khi trích xuất nội dung
function removeNoise(doc) {
    doc.select("script, style, ins, iframe").remove();
    doc.select(".advert, .advertisement, [class*=advert], [id*=advert]").remove();
    doc.select("[class*=' ads'], [class*='ads '], [class$=ads], [class^=ads]").remove();
    doc.select("[id*=' ads'], [id*='ads '], [id$=ads], [id^=ads]").remove();
    doc.select(".chapter-footer, .chapter-header, .readBtn, .bottem, .bottom, .top, .chapter-nav, .read-nav").remove();
}

// Phát hiện số trang của chương — DedeCMS dùng chapBase_N.html
// chapPath: path không có .html và không có _N suffix ("/wxxz/20921/index/1")
// Tìm link dạng "/wxxz/20921/index/1_2.html", "_3.html"... trong navigation
// GỌI TRƯỚC removeNoise/findContent vì removeNoise sẽ xóa .bottem chứa nav
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

// Strip 　　 prefix từ text — tránh translator Vietphrase xử lý sai full-width space
function stripIndent(txt) {
    return txt.replace(/^\u3000+/, "").trim();
}

function findContent(doc) {
    removeNoise(doc);
    var el = selFirst(doc, CHAP_CSS);
    if (el) {
        el.select("a").remove(); // Xóa link nav/promo inject vào nội dung (下一章, ads...)
        // Ưu tiên: xử lý trực tiếp từng <p> → mỗi <p> = 1 đoạn, nối bằng \n\n
        // KHÔNG dùng addIndent() — translator Vietphrase sẽ strip \n\n nếu có 　　 prefix
        var paras = el.select("p");
        if (paras.size() > 2) {
            var parts = [];
            for (var i = 0; i < paras.size(); i++) {
                var ptxt = stripIndent(stripHtml(paras.get(i).html()));
                if (!ptxt || PROMO_LINE_RE.test(ptxt)) continue;
                parts.push(ptxt);
            }
            if (parts.length > 0) {
                var joined = parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
                if (joined.length > 200) return joined;
            }
        }
        // Fallback: stripHtml toàn bộ HTML (khi không dùng <p> tags, dùng <br>)
        var txt = stripHtml(el.html());
        txt = txt.replace(/^\u3000+/gm, "").replace(/\n{3,}/g, "\n\n").trim();
        if (txt.length > 200) return txt;
    }
    // Fallback: duyệt div có text dài nhất — bỏ qua div chứa nhiều link (nav/list)
    var divs = doc.select("div");
    var best = null;
    var bestLen = 200;
    for (var i = 0; i < divs.size(); i++) {
        var d = divs.get(i);
        var textLen = d.text().length;
        if (textLen <= bestLen) continue;
        // Lọc div có tỉ lệ link/text cao — là nav hoặc danh sách, không phải nội dung
        var linkLen = d.select("a").text().length;
        if (linkLen > textLen * 0.4) continue;
        bestLen = textLen;
        best = d;
    }
    if (best) {
        var ftxt = stripHtml(best.html());
        ftxt = ftxt.replace(/^\u3000+/gm, "").replace(/\n{3,}/g, "\n\n").trim();
        return ftxt;
    }
    return "";
}

function execute(url) {
    var chapUrl = resolveUrl(url);

    // chapPath: chuẩn hóa URL về base chương (bỏ .html và suffix _N nếu có)
    // VD: /wxxz/20921/index/1_2.html → /wxxz/20921/index/1
    var chapPath = chapUrl.replace(BASE_URL, "")
                          .replace(/\.html$/, "")
                          .replace(/_\d+$/, "");

    // Primary: browser (xử lý GBK encoding đúng)
    var doc = fetchBrowser(chapUrl);

    // Fallback: HTTP fetch
    if (!doc) {
        var res = fetchRetry(chapUrl);
        if (!res || !res.ok) return Response.error("Không thể tải chương");
        doc = res.html();
        if (!doc) return Response.error("Không thể tải chương");
    }

    // Phát hiện số trang TRƯỚC removeNoise (removeNoise xóa .bottem chứa nav)
    var maxPage = detectChapPages(doc, chapPath);

    var content = findContent(doc);

    // Fetch các trang tiếp theo của cùng chương (tối đa 5 trang)
    for (var p = 2; p <= maxPage && p <= 5; p++) {
        var pageUrl = BASE_URL + chapPath + "_" + p + ".html";
        var pageDoc = fetchBrowser(pageUrl, 8000);
        if (!pageDoc) break;
        var pageContent = findContent(pageDoc);
        if (pageContent) content = content + "\n\n" + pageContent;
    }

    if (!content || content.length < 50) return Response.error("Không tìm thấy nội dung chương");
    return Response.success(content);
}
