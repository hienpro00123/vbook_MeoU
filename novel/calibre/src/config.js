var BASE_URL = String(SERVER_URL || "").replace(/\/+$/, "");

function calibreRequest(path) {
    if (!/^https?:\/\/[^\/?#]+(?:\/[^?#]*)?$/i.test(BASE_URL) || path.charAt(0) !== "/") {
        return { error: "Địa chỉ Calibre không hợp lệ" };
    }
    var url = BASE_URL + path;
    var response = fetch(url);
    if (response.status === 401 && CALIBRE_USER) {
        var challenge = String(response.header("WWW-Authenticate") || "");
        var fields = {};
        var re = /(\w+)\s*=\s*(?:"((?:\\.|[^"])*)"|([^,\s]+))/g;
        var match;
        while ((match = re.exec(challenge))) {
            fields[match[1].toLowerCase()] = (match[2] == null ? match[3] : match[2].replace(/\\(.)/g, "$1"));
        }
        if (!/^digest\b/i.test(challenge) || !fields.realm || !fields.nonce ||
            (fields.algorithm && fields.algorithm.toLowerCase() !== "md5")) {
            return { error: "Server yêu cầu phương thức xác thực không được hỗ trợ" };
        }
        var qop = fields.qop || "";
        if (qop && !/(^|,)\s*auth\s*(,|$)/i.test(qop)) {
            return { error: "Server yêu cầu Digest qop không được hỗ trợ" };
        }
        var uri = url.replace(/^https?:\/\/[^\/]+/i, "");
        var md5 = function (s) { return String(CryptoJS.MD5(s)); };
        var cnonce = String(CryptoJS.lib.WordArray.random(16));
        var nc = "00000001";
        var ha1 = md5(String(CALIBRE_USER) + ":" + fields.realm + ":" + String(CALIBRE_PASSWORD));
        var ha2 = md5("GET:" + uri);
        var digest = qop ? md5(ha1 + ":" + fields.nonce + ":" + nc + ":" + cnonce + ":auth:" + ha2)
            : md5(ha1 + ":" + fields.nonce + ":" + ha2);
        var quote = function (s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; };
        var authorization = "Digest username=" + quote(CALIBRE_USER) + ", realm=" + quote(fields.realm)
            + ", nonce=" + quote(fields.nonce) + ", uri=" + quote(uri) + ", response=" + quote(digest);
        if (fields.opaque) authorization += ", opaque=" + quote(fields.opaque);
        if (qop) authorization += ", qop=auth, nc=" + nc + ", cnonce=" + quote(cnonce);
        response = fetch(url, { headers: { Authorization: authorization } });
    }
    if (!response.ok) {
        return { error: response.status === 401 ? "Đăng nhập Calibre thất bại" : "Calibre HTTP " + response.status };
    }
    return { response: response };
}

function calibreJson(path) {
    var result = calibreRequest(path);
    if (result.error) return result;
    return { data: result.response.json() };
}

function bookPath(id, library) {
    return "/ajax/book/" + id + "/" + encodeURIComponent(library);
}

function parseBook(url) {
    var prefix = BASE_URL + "/ajax/book/";
    if (String(url).indexOf(prefix) !== 0) return null;
    var match = String(url).slice(prefix.length).match(/^(\d+)\/([^/?#]+)\/?$/);
    return match ? { id: match[1], library: decodeURIComponent(match[2]) } : null;
}

function absolute(path) {
    return BASE_URL + path;
}

function coverUrl(path) {
    if (!path) return { data: "" };
    if (path.charAt(0) !== "/") return { error: "Đường dẫn ảnh bìa Calibre không hợp lệ" };
    if (!CALIBRE_USER) return { data: absolute(path) };
    var result = calibreRequest(path);
    if (result.error) return result;
    return { data: "data:image/jpeg;base64," + result.response.base64() };
}

function bookItems(library, ids) {
    if (!ids.length) return { data: [] };
    var result = calibreJson("/ajax/books/" + encodeURIComponent(library) + "?category_urls=false&ids=" + ids.join(","));
    if (result.error) return result;
    var items = [];
    for (var i = 0; i < ids.length; i++) {
        var book = result.data[String(ids[i])];
        if (!book) return { error: "Không lấy được metadata sách " + ids[i] };
        var cover = coverUrl(book.thumbnail);
        if (cover.error) return cover;
        items.push({
            name: book.title,
            link: absolute(bookPath(ids[i], library)),
            cover: cover.data,
            description: (book.authors || []).join(", ")
        });
    }
    return { data: items };
}

function bookList(library, path, offset) {
    var result = calibreJson(path + (path.indexOf("?") < 0 ? "?" : "&") + "num=25&offset=" + offset);
    if (result.error) return result;
    if (!result.data || !Array.isArray(result.data.book_ids)) return { error: "Danh sách sách Calibre không hợp lệ" };
    var items = bookItems(library, result.data.book_ids);
    if (items.error) return items;
    items.next = offset + result.data.book_ids.length < result.data.total_num
        ? String(offset + result.data.book_ids.length) : "";
    return items;
}

function pageOffset(page) {
    if (!page) return 0;
    if (!/^\d+$/.test(String(page))) return -1;
    return Number(page);
}

function manifest(book, format) {
    var path = "/book-manifest/" + book.id + "/" + format + "?library_id=" + encodeURIComponent(book.library);
    for (var i = 0; i < 15; i++) {
        var result = calibreJson(path);
        if (result.error) return result;
        if (result.data && Array.isArray(result.data.spine) && result.data.book_hash) return result;
        if (!result.data || result.data.traceback || result.data.aborted || result.data.job_id == null) {
            return { error: "Calibre không thể chuẩn bị sách " + format.toUpperCase() };
        }
        sleep(1000);
    }
    return { error: "Calibre đang chuẩn bị sách; vui lòng thử lại" };
}

function selectedFormat(formats) {
    var supported = ["epub", "azw3", "mobi", "txt"];
    for (var i = 0; i < supported.length; i++) {
        if (formats.indexOf(supported[i]) !== -1) return supported[i];
    }
    return "";
}
