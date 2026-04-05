load("config.js");

// Selector nội dung chương — thêm selectors mới của metruyenchu, giữ còn generic fallback
var CHAP_CSS = "#chapter-content, .chapter-content, .chap-content, " +
    "#chapter-detail-content, .box-chapter-content, " +
    ".content-chapter, .truyen, #truyen-content, .truyen-content, " +
    ".reading-content, .content-text, .text-content, " +
    "#noi-dung, .noi-dung, .box-reading, " +
    ".story-content, .text-story, #story-content";

// Dọn noise trước khi trích xuất — script, ads, nav, comment
function removeNoise(doc) {
    doc.select("script, style, ins, iframe, noscript").remove();
    doc.select(".ads, .ad-wrapper, .quang-cao, .advertisement").remove();
    doc.select("[class*=advert], [id*=advert], [class*=-ads], [id*=-ads]").remove();
    doc.select(".chapter-header, .chapter-footer, .chapter-info, .action-bar").remove();
    doc.select(".chapter-nav, .nav-chapter, .page-nav, .btn-chapter, .chapter-title").remove();
    doc.select(".comment, .comment-area, .fb-comments, #disqus_thread").remove();
}

// Dọn watermark/noise text — dấu · và ký tự rác mà sites inject vào nội dung
function cleanText(txt) {
    return txt
        .replace(/[\u00b7\u2022\u22c5]{2,}/g, "")     // 2+ dấu chấm giữa liên tiếp → xóa
        .replace(/^\s*[\u00b7\u2022]\s*/gm, "")         // · đầu dòng → xóa
        .replace(/\s*[\u00b7\u2022]\s*$/gm, "")         // · cuối dòng → xóa
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function findContent(doc) {
    removeNoise(doc);
    var el = selFirst(doc, CHAP_CSS);
    if (el) {
        var txt = cleanText(stripHtml(el.html()));
        if (txt.length > 100) return txt;
    }
    // Fallback: duyệt div[class]/div[id], chọn div text dài nhất
    // Bỏ qua div có tỉ lệ link/text cao — là nav hoặc danh sách
    var divs = doc.select("div[class], div[id]");
    var best = null;
    var bestLen = 200;
    for (var i = 0; i < divs.size(); i++) {
        var d = divs.get(i);
        var textLen = d.text().length;
        if (textLen <= bestLen) continue;
        var linkLen = d.select("a").text().length;
        if (linkLen > textLen * 0.4) continue;
        bestLen = textLen;
        best = d;
    }
    return best ? cleanText(stripHtml(best.html())) : "";
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var content = "";

    // Fast path: HTTP fetch (metruyenchu phục vụ nội dung qua HTML tĩnh)
    var res = fetchRetry(chapUrl);
    if (res && res.ok) {
        var doc = res.html();
        if (doc) content = findContent(doc);
    }

    // Slow path: browser — chỉ khi HTTP trả về rỗng hoàn toàn
    if (!content) {
        var doc2 = fetchBrowser(chapUrl);
        if (doc2) content = findContent(doc2);
    }

    if (!content || content.length < 50) return Response.error("Không tìm thấy nội dung chương");
    return Response.success(content);
}
