load("config.js");

// Map category slug → tên hiển thị
var GENRE_MAP = {
    dsyq: "\u90fd\u5e02\u8a00\u60c5",
    wxxz: "\u6b66\u4fa0\u4fee\u771f",
    xhqh: "\u7384\u5e7b\u5947\u5e7b",
    cyjk: "\u7a7f\u8d8a\u67b6\u7a7a",
    khjj: "\u79d1\u5e7b\u7ade\u6280",
    ghxy: "\u9b3c\u8bdd\u60ac\u7591",
    jsls: "\u519b\u4e8b\u5386\u53f2",
    guanchang: "\u5b98\u573a\u5546\u6218",
    xtfq: "\u4e61\u571f\u98ce\u60c5",
    dmtr: "\u803b\u7f8e\u5c0f\u8bf4",
    trxs: "\u540c\u4eba\u5c0f\u8bf4",
    jqxs: "\u7cbe\u54c1\u5c0f\u8bf4"
};

function execute(url) {
    var storyUrl = resolveUrl(url);
    var doc = fetchBrowser(storyUrl, 7000);
    if (!doc) return Response.error("Lỗi tải trang truyện");

    // --- Tên truyện ---
    var nameEl = selFirst(doc, "h1, h2.title, .book-title, .btitle, .story-title");
    var name = nameEl ? nameEl.text().trim() : "";
    // Fallback: lấy từ <title> tag
    if (!name) {
        var titleTag = selFirst(doc, "title");
        if (titleTag) {
            name = titleTag.text().trim().replace(/\s*[-_|]\s*.*$/, "").trim();
        }
    }

    // --- Ảnh bìa ---
    // Thử các selector phổ biến theo thứ tự ưu tiên
    var cover = "";
    var picEl = selFirst(doc, ".pic img, .bookimg img, .cover img, .bookthumb img, .thumb img, .book-pic img, .info-pic img");
    if (picEl) {
        cover = picEl.attr("data-src") || picEl.attr("data-original") || picEl.attr("src") || "";
    }
    // Fallback: og:image meta tag
    if (!cover) {
        var metaOg = selFirst(doc, "meta[property='og:image']");
        if (metaOg) cover = metaOg.attr("content") || "";
    }
    // Fallback: img đầu tiên không phải logo/icon
    if (!cover) {
        var imgs = doc.select("img[src]");
        for (var ii = 0; ii < imgs.size(); ii++) {
            var isrc = imgs.get(ii).attr("src") || "";
            if (isrc && isrc.indexOf("logo") === -1 && isrc.indexOf("icon") === -1 && isrc.indexOf("banner") === -1) {
                cover = isrc;
                break;
            }
        }
    }
    if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;

    // --- Tác giả ---
    var author = "";
    // Thử selector phổ biến
    var authorEl = selFirst(doc, ".author a, .zuozhe a, [class*='author'] a, a[href*='/author/']");
    if (authorEl) {
        author = authorEl.text().trim();
    }
    if (!author) {
        // Scan p và span tìm "作者："
        var spans = doc.select("p, span, em");
        for (var ai = 0; ai < spans.size(); ai++) {
            var atxt = spans.get(ai).text().trim();
            var am = /\u4f5c\u8005[\uff1a:]\s*(.+)/.exec(atxt);  // 作者：
            if (am && am[1] && am[1].length < 50) {
                author = am[1].trim();
                break;
            }
        }
    }

    // --- Mô tả ---
    var descEl = selFirst(doc, ".intro, #intro, .desc, .summary, .synopsis, [class*='intro'], [class*='desc'], [class*='summary']");
    var description = descEl ? stripHtml(descEl.html()) : "";
    // Fallback: tìm đoạn text sau "简介"
    if (!description) {
        var allPs = doc.select("p");
        var foundIntro = false;
        var lines = [];
        for (var di = 0; di < allPs.size(); di++) {
            var ptxt = allPs.get(di).text().trim();
            if (!foundIntro && ptxt.indexOf("\u7b80\u4ecb") !== -1) { foundIntro = true; continue; }  // 简介
            if (foundIntro && ptxt.length > 10) {
                lines.push(ptxt);
                if (lines.length >= 5) break;
            }
        }
        if (lines.length > 0) description = lines.join("\n");
    }

    // --- Trạng thái: 全本/完结 = đã hoàn thành ---
    var ongoing = true;
    if (name.indexOf("\u5168\u672c") !== -1 || name.indexOf("\u5b8c\u7ed3") !== -1) ongoing = false;  // 全本, 完结
    if (ongoing) {
        var statusEl = selFirst(doc, ".status, [class*='status'], .complete, [class*='complete']");
        if (statusEl) {
            var stxt = statusEl.text();
            if (stxt.indexOf("\u5168\u672c") !== -1 || stxt.indexOf("\u5b8c\u7ed3") !== -1 || stxt.indexOf("\u5b8c") !== -1) ongoing = false;
        }
    }

    // --- Thể loại từ URL ---
    var genres = [];
    var catM = /\/(dsyq|wxxz|xhqh|cyjk|khjj|ghxy|jsls|guanchang|xtfq|dmtr|trxs|jqxs)\//.exec(storyUrl);
    if (catM) {
        var catSlug = catM[1];
        genres.push({ title: GENRE_MAP[catSlug] || catSlug, input: catSlug, script: "genrecontent.js" });
    }

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author,
        description: description,
        detail: genres.length > 0 ? "\u5206\u7c7b\uff1a" + genres[0].title : "",
        ongoing: ongoing,
        genres: genres,
        suggests: [{ title: "\u63a8\u8350", input: storyUrl, script: "suggest.js" }]
    });
}
