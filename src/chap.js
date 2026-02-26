load("config.js");

// Chap: Lấy nội dung chương truyện
// url = từ toc.js, có thể là:
//   - /book-file/{bookId}/{fmt}/{size}/{mtime}/{name}?library_id=xxx  (EPUB chapter)
//   - /get/txt/{bookId}/{library_id}   (TXT toàn bộ)
//   - /get/{fmt}/{bookId}/{library_id} (format khác)
function execute(url) {
    var response = calibreFetch(url);
    if (!response.ok) {
        return Response.error("Không thể tải nội dung. Mã lỗi: " + response.status);
    }

    // === EPUB CHAPTER (từ book-file endpoint) ===
    if (url.indexOf("/book-file/") >= 0) {
        return handleBookFile(response);
    }

    // === TXT FORMAT ===
    if (url.indexOf("/get/txt/") >= 0) {
        return handleTextContent(response);
    }

    // === CÁC FORMAT KHÁC ===
    try {
        var doc = response.html();
        if (doc) {
            doc.select("script").remove();
            doc.select("style").remove();
            doc.select("link").remove();
            doc.select("meta").remove();
            doc.select("head").remove();

            var body = doc.select("body");
            if (body.size() > 0) {
                var content = body.html();
                if (content && content.trim().length > 0) {
                    return Response.success(content);
                }
            }
        }
    } catch (e) {
        // Not HTML
    }

    // Fallback: text
    return handleTextContent(response);
}

// Xử lý nội dung từ book-file endpoint
// Calibre content server trả về JSON dạng calibre-html-as-json:
// {"version":1, "tree":{"n":"html", "c":[...], "x":"text", "l":"tail"}}
// Trong đó:
//   n = tag name, c = children, x = text content trước child đầu tiên,
//   l = tail text sau closing tag, a = attributes [[key,val],...]
function handleBookFile(response) {
    var text = response.text();
    if (!text || text.trim().length === 0) {
        return Response.error("Chương không có nội dung");
    }

    var firstChar = text.trim().charAt(0);

    // === HTML/XHTML gốc ===
    if (firstChar === "<") {
        var doc = Html.parse(text);
        doc.select("script").remove();
        doc.select("style").remove();
        doc.select("link").remove();
        doc.select("noscript").remove();
        var body = doc.select("body");
        if (body.size() > 0) return Response.success(body.html());
        return Response.success(doc.html());
    }

    // === Calibre html_as_json format ===
    if (firstChar === "{") {
        try {
            var json = JSON.parse(text);
            // Format: {"version":1, "tree":{"n":"html", "c":[...]}}
            var tree = json.tree || json;
            var bodyHtml = extractFromCalibreJson(tree);
            if (bodyHtml && bodyHtml.trim().length > 0) {
                return Response.success(bodyHtml);
            }
        } catch (e) {
            Console.log("JSON parse error: " + e);
        }
    }

    // === Fallback: raw text ===
    return Response.success("<pre>" + text.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>");
}

// Xử lý nội dung text thuần (TXT format)
function handleTextContent(response) {
    var text;
    try {
        text = response.text("UTF-8");
    } catch (e) {
        text = response.text();
    }
    if (!text || text.trim().length === 0) {
        return Response.error("Nội dung trống");
    }

    var paragraphs = text.split(/\n\s*\n/);
    var html = "";
    for (var i = 0; i < paragraphs.length; i++) {
        var para = paragraphs[i].trim();
        if (para.length > 0) {
            para = para.replace(/\n/g, "<br>");
            html += "<p>" + para + "</p>\n";
        }
    }
    if (html.length === 0) {
        html = "<p>" + text.replace(/\n/g, "<br>") + "</p>";
    }
    return Response.success(html);
}

// ============================================================
// Parser cho Calibre html_as_json format
// ============================================================
// Cấu trúc node: { n: "tagname", c: [children], x: "text", l: "tail", a: [["attr","val"]] }
// - n (name): tên thẻ HTML (p, div, h1, span, ...)
// - x (text): nội dung text TRƯỚC child đầu tiên
// - l (tail): nội dung text SAU closing tag (thuộc parent)
// - c (children): mảng các node con
// - a (attrs): mảng [key, value] của attributes
// Ví dụ: <p>Hello <b>world</b>!</p>
//   → {n:"p", x:"Hello ", c:[{n:"b", x:"world", l:"!"}]}

function extractFromCalibreJson(node) {
    if (!node) return "";
    if (typeof node === "string") return escapeHtml(node);

    var tag = node.n || "";
    var nodeText = node.x || "";  // text trước children
    var tail = node.l || "";      // text sau closing tag
    var children = node.c || [];

    // Bỏ qua script, style, link, head
    var skipTags = ["script", "style", "link", "meta", "head", "title"];
    if (skipTags.indexOf(tag) >= 0) return tail ? escapeHtml(tail) : "";

    // Nếu tag là "html", chỉ tìm body bên trong
    if (tag === "html") {
        for (var h = 0; h < children.length; h++) {
            if (children[h].n === "body") {
                return extractFromCalibreJson(children[h]);
            }
        }
        // Không tìm thấy body → render tất cả children
        var allHtml = "";
        for (var h2 = 0; h2 < children.length; h2++) {
            allHtml += extractFromCalibreJson(children[h2]);
        }
        return allHtml;
    }

    // Xây dựng HTML
    var result = "";

    // Các thẻ cần giữ lại
    var renderTags = ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6",
        "blockquote", "ul", "ol", "li", "br", "hr", "em", "strong", "b", "i",
        "span", "a", "sup", "sub", "table", "tr", "td", "th", "tbody",
        "section", "article", "aside", "body", "img"];
    var keepTag = renderTags.indexOf(tag) >= 0;

    if (keepTag && tag) {
        result += "<" + tag;
        // Giữ lại một số attributes quan trọng
        if (node.a) {
            for (var ai = 0; ai < node.a.length; ai++) {
                var attrName = node.a[ai][0];
                var attrVal = node.a[ai][1] || "";
                // Chỉ giữ class, id, và data attributes
                if (attrName === "class" || attrName === "id") {
                    result += " " + attrName + '="' + escapeHtml(attrVal) + '"';
                }
            }
        }
        result += ">";
    }

    // Text content
    if (nodeText) {
        result += escapeHtml(nodeText);
    }

    // Children
    for (var ci = 0; ci < children.length; ci++) {
        result += extractFromCalibreJson(children[ci]);
    }

    // Closing tag
    if (keepTag && tag && tag !== "br" && tag !== "hr" && tag !== "img") {
        result += "</" + tag + ">";
    }

    // Tail text (thuộc parent scope)
    if (tail) {
        result += escapeHtml(tail);
    }

    return result;
}

// Escape HTML entities nhưng giữ nguyên nếu đã là safe text
function escapeHtml(str) {
    if (!str) return "";
    // Calibre đã xử lý entities trong JSON, chỉ cần return
    return str;
}
