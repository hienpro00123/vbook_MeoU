load('crypto.js');
load('config.js');

function execute(url) {
    var prefix = BASE_URL + "/calibre-chapter/";
    if (String(url).indexOf(prefix) !== 0) return Response.error("Địa chỉ chương không hợp lệ");
    var input;
    try {
        input = JSON.parse(decodeURIComponent(String(url).slice(prefix.length)));
    } catch (e) {
        return Response.error("Địa chỉ chương không hợp lệ");
    }
    if (!input || !/^\d+$/.test(String(input.id)) || !/^\d+$/.test(String(input.size)) ||
        !/^\d+$/.test(String(input.mtime)) || !input.library || !input.file ||
        !/^(epub|azw3|mobi|txt)$/.test(input.format)) {
        return Response.error("Thông tin chương không hợp lệ");
    }
    function filePath(name) {
        var parts = String(name).split("/");
        for (var i = 0; i < parts.length; i++) {
            if (!parts[i] || parts[i] === "." || parts[i] === "..") return "";
            parts[i] = encodeURIComponent(parts[i]);
        }
        return "/book-file/" + input.id + "/" + input.format + "/" + input.size + "/" + input.mtime
            + "/" + parts.join("/") + "?library_id=" + encodeURIComponent(input.library);
    }
    var path = filePath(input.file);
    if (!path) return Response.error("Đường dẫn chương không hợp lệ");
    var result = calibreJson(path);
    if (result.error) return Response.error(result.error);
    if (!result.data || !result.data.tree) return Response.error("Dữ liệu chương Calibre không hợp lệ");
    var error = "";
    var allowed = /^(html|body|div|p|span|h1|h2|h3|h4|h5|h6|br|hr|strong|b|em|i|u|s|sub|sup|blockquote|pre|code|ul|ol|li|table|thead|tbody|tr|th|td|img|a)$/;
    function escapeHtml(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function resource(src) {
        var marker = String(input.link_uid || "") + "|";
        if (!input.link_uid || src.indexOf(marker) !== 0) {
            error = "Ảnh trong sách không có đường dẫn Calibre hợp lệ";
            return "";
        }
        var encoded = src.slice(marker.length).split("|")[0].split("#")[0];
        var name;
        try {
            name = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encoded));
        } catch (e) {
            error = "Không giải mã được đường dẫn ảnh trong sách";
            return "";
        }
        var imagePath = filePath(name);
        if (!imagePath) {
            error = "Đường dẫn ảnh trong sách không hợp lệ";
            return "";
        }
        var image = calibreRequest(imagePath);
        if (image.error) {
            error = image.error;
            return "";
        }
        var mime = String(image.response.header("Content-Type") || "").split(";")[0].toLowerCase();
        if (!/^image\/(jpeg|png|gif|webp)$/.test(mime)) {
            error = "Định dạng ảnh trong sách chưa được hỗ trợ";
            return "";
        }
        return "data:" + mime + ";base64," + image.response.base64();
    }
    function render(node) {
        if (!node || typeof node !== "object") return "";
        var name = String(node.n || "").toLowerCase();
        if (name === "head" || name === "script" || name === "style") return escapeHtml(node.l || "");
        var content = escapeHtml(node.x || "");
        var children = node.c || [];
        for (var i = 0; i < children.length; i++) content += render(children[i]);
        var tail = escapeHtml(node.l || "");
        if (!allowed.test(name)) return content + tail;
        if (name === "html" || name === "body" || name === "a") return content + tail;
        var attrs = "";
        if (name === "img") {
            var source = "";
            var alt = "";
            var pairs = node.a || [];
            for (var j = 0; j < pairs.length; j++) {
                if (pairs[j][0] === "src") source = pairs[j][1];
                if (pairs[j][0] === "alt") alt = pairs[j][1];
            }
            if (!source) {
                error = "Ảnh trong sách thiếu đường dẫn";
                return "";
            }
            attrs = ' src="' + escapeHtml(resource(source)) + '" alt="' + escapeHtml(alt) + '"';
        }
        if (name === "br" || name === "hr" || name === "img") return "<" + name + attrs + ">" + tail;
        return "<" + name + attrs + ">" + content + "</" + name + ">" + tail;
    }
    var html = render(result.data.tree);
    if (error) return Response.error(error);
    return Response.success(html);
}
