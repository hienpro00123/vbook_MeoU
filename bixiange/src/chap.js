load("config.js");

// Các selector nội dung chương — thử theo thứ tự ưu tiên
var CHAP_CSS = "#content, .content, #BookText, #chaptercontent, .chaptercontent, " +
    ".read-content, .reading-content, .chapter-content, " +
    "#article-content, .article-content, .story-content, " +
    "article, main";

// Thêm indent　　cho từng đoạn — chuẩn tiểu thuyết Trung Quốc
// - Dòng đã có 　 (full-width space \u3000) → giữ nguyên
// - Dòng ngắn < 15 ký tự (tiêu đề/phân cách) → không indent
// - Dòng nội dung bình thường → thêm 　　 đầu dòng
function addIndent(text) {
    var lines = text.split("\n");
    var out = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = line.replace(/^[ \t]+/, "").replace(/[ \t]+$/, "");
        if (!trimmed) { out.push(""); continue; }
        if (trimmed.charAt(0) === "\u3000") { out.push(trimmed); continue; }
        if (trimmed.length < 15) { out.push(trimmed); continue; }
        out.push("\u3000\u3000" + trimmed);
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function findContent(doc) {
    var el = selFirst(doc, CHAP_CSS);
    if (el) {
        var txt = stripHtml(el.html());
        if (txt.length > 200) return addIndent(txt);
    }
    // Fallback: div có text dài nhất, dừng sớm khi > 5000
    var divs = doc.select("div");
    var best = null;
    var bestLen = 200;
    for (var i = 0; i < divs.size(); i++) {
        var d = divs.get(i);
        var len = d.text().length;
        if (len > bestLen) { bestLen = len; best = d; if (len > 5000) break; }
    }
    return best ? addIndent(stripHtml(best.html())) : "";
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var content = "";

    // Primary: browser (xử lý GBK encoding đúng)
    var doc = fetchBrowser(chapUrl);
    if (doc) content = findContent(doc);

    // Fallback: HTTP fetch
    if (!content) {
        var res = fetchRetry(chapUrl);
        if (res && res.ok) {
            var doc2 = res.html();
            if (doc2) content = findContent(doc2);
        }
    }

    if (!content || content.length < 50) return Response.error("Không tìm thấy nội dung chương");
    return Response.success(content);
}
