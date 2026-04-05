load("config.js");

// =============================================================================
// Cấu trúc thực tế metruyenchu (đã xác nhận qua raw HTML):
//   <div id="vungdoc">
//     <div class="chapter_wrap">   ← tiêu đề + nav (xóa trước khi đọc text)
//       <div class="chapter-title">...</div>
//       <div class="chapter_control" id="gotochap">...</div>
//       <div><button id="download-book">Tải Ebook</button></div>
//     </div>
//     <div class="truyen">         ← NỘI DUNG TEXT dạng <br><br>
//       Văn bản chương...<br><br>...
//     </div>
//   </div>
// =============================================================================

// Làm sạch text — xóa watermark, chuẩn hóa khoảng trắng
function cleanText(txt) {
    return txt
        .replace(/[\u00b7\u2022\u22c5]{2,}/g, "")
        .replace(/^\s*[\u00b7\u2022]\s*/gm, "")
        .replace(/\s*[\u00b7\u2022]\s*$/gm, "")
        .replace(/^\s*[Tt]ải\s+[Ee]book\b[^\n]*/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function findContent(doc) {
    // === Pass 1: target trực tiếp div.truyen trong #vungdoc ===
    var el = selFirst(doc, "#vungdoc .truyen");
    if (!el) el = selFirst(doc, ".truyen");

    if (el) {
        el.select("a, button, script, style, ins, noscript").remove();
        var txt = cleanText(stripHtml(el.html()));
        if (txt.length > 100) return txt;
    }

    // === Pass 2: fallback — dùng #vungdoc, xóa nav/button rồi trích text ===
    var vungdoc = selFirst(doc, "#vungdoc");
    if (vungdoc) {
        vungdoc.select("script, style, ins, iframe, noscript, button").remove();
        vungdoc.select(".chapter_wrap, .chapter-title, .chapter_control").remove();
        vungdoc.select("#gotochap, #download-book").remove();
        vungdoc.select(".ads, .ad-wrapper, [class*=advert], [id*=advert]").remove();
        vungdoc.select(".comment, #disqus_thread").remove();
        vungdoc.select("a").remove();
        var txt2 = cleanText(stripHtml(vungdoc.html()));
        if (txt2.length > 100) return txt2;
    }

    // === Pass 3: last resort — quét div, lấy div text dài nhất (không nhiều link) ===
    doc.select("script, style, ins, iframe, noscript").remove();
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

    // Metruyenchu trả nội dung trong static HTML → fetch thường là đủ
    var res = fetchRetry(chapUrl);
    if (res && res.ok) {
        var doc = res.html();
        if (doc) content = findContent(doc);
    }

    // Browser fallback — chỉ khi HTTP không trả nội dung
    if (!content) {
        var doc2 = fetchBrowser(chapUrl);
        if (doc2) content = findContent(doc2);
    }

    if (!content || content.length < 50) return Response.error("Không tìm thấy nội dung chương");
    return Response.success(content);
}
