// ============================================================
// CẤU HÌNH CALIBRE CONTENT SERVER
// ============================================================
// ĐỊA CHỈ CALIBRE SERVER (PHẢI là IP LAN của PC, KHÔNG dùng localhost)
// Vì script chạy trên điện thoại → localhost = điện thoại chứ không phải PC
// Bật server: Calibre → Preferences → Sharing over the net → Start server
// Hoặc chạy: calibre-server --port 8080 "/đường/dẫn/thư/viện"
var BASE_URL = "http://192.168.1.100:8080";

// ID thư viện Calibre (để trống = thư viện mặc định)
// Xem danh sách thư viện tại: http://<IP>:8080/ajax/library-info
var LIBRARY_ID = "kho_truyện";

// ============================================================
// TÀI KHOẢN ĐĂNG NHẬP (nếu server bật xác thực)
// ============================================================
// Để trống nếu server không yêu cầu đăng nhập
var USERNAME = "";
var PASSWORD = "";

// ============================================================
// CẤU HÌNH HIỂN THỊ
// ============================================================
// Số sách tải mỗi trang
var PAGE_SIZE = 20;

// ============================================================
// HÀM HỖ TRỢ DÙNG CHUNG
// ============================================================

// Trả về đường dẫn library cho AJAX/GET endpoint (path segment)
// Dùng cho: /ajax/search/{library_id}, /get/{what}/{bookId}/{library_id}
function libraryPath() {
    return LIBRARY_ID ? "/" + encodeURIComponent(LIBRARY_ID) : "";
}

// Trả về query parameter library_id cho BOOK endpoint
// Dùng cho: /book-manifest/{bookId}/{fmt}?library_id=xxx
// (endpoint này KHÔNG nhận library_id trong path!)
function libraryQuery(prefix) {
    if (!LIBRARY_ID) return "";
    var sep = prefix || "?";
    return sep + "library_id=" + encodeURIComponent(LIBRARY_ID);
}

// Base64 encode (cho Basic Auth - phòng trường hợp btoa không khả dụng)
function base64Encode(str) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var result = "";
    var i = 0;
    var len = str.length;
    while (i < len) {
        var startI = i;
        var a = str.charCodeAt(i++) || 0;
        var b = i < len ? str.charCodeAt(i++) : 0;
        var c = i < len ? str.charCodeAt(i++) : 0;
        var bytesRead = i - startI;
        var triplet = (a << 16) | (b << 8) | c;
        result += chars.charAt((triplet >> 18) & 63);
        result += chars.charAt((triplet >> 12) & 63);
        result += bytesRead > 1 ? chars.charAt((triplet >> 6) & 63) : "=";
        result += bytesRead > 2 ? chars.charAt(triplet & 63) : "=";
    }
    return result;
}

// Gửi HTTP request đến Calibre server (tự thêm auth nếu cấu hình)
function calibreFetch(path, options) {
    var url = path;
    if (path.indexOf("http") !== 0) {
        url = BASE_URL + path;
    }
    options = options || {};
    options.headers = options.headers || {};

    // Thêm Basic Auth header nếu có tài khoản
    if (USERNAME && PASSWORD) {
        options.headers["Authorization"] = "Basic " + base64Encode(USERNAME + ":" + PASSWORD);
    }

    return fetch(url, options);
}

// Trích xuất book ID từ URL dạng /book/{id}
function extractBookId(url) {
    var match = url.match(/\/book\/(\d+)/);
    if (match) return match[1];
    // Thử lấy số cuối cùng trong URL
    var parts = url.split("/");
    for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i] && parts[i].match(/^\d+$/)) {
            return parts[i];
        }
    }
    return url;
}

// Lấy metadata nhiều sách cùng lúc qua API /ajax/books
function getBooksMeta(bookIds) {
    if (!bookIds || bookIds.length === 0) return {};
    var ids = bookIds.join(",");
    var response = calibreFetch("/ajax/books" + libraryPath() + "?ids=" + ids);
    if (response.ok) {
        return response.json();
    }
    return {};
}

// Chuyển đổi metadata Calibre → định dạng vBook book item
function toBookItem(bookId, meta) {
    var authors = "";
    if (meta.authors && meta.authors.length > 0) {
        authors = meta.authors.join(", ");
    }
    var coverUrl = "";
    if (meta.thumbnail) {
        coverUrl = BASE_URL + meta.thumbnail;
    } else if (meta.cover) {
        coverUrl = BASE_URL + meta.cover;
    } else {
        coverUrl = BASE_URL + "/get/thumb/" + bookId + libraryPath();
    }
    var desc = authors;
    if (meta.series) {
        desc += " | " + meta.series;
        if (meta.series_index) desc += " #" + meta.series_index;
    }
    return {
        name: meta.title || "Không có tiêu đề",
        link: "/book/" + bookId,
        host: BASE_URL,
        cover: coverUrl,
        description: desc
    };
}

// Hàm chung: Lấy danh sách sách từ một URL API trả về book_ids
// Dùng cho homecontent, genrecontent, suggest
function fetchBooksList(inputUrl, page) {
    var offset = page ? parseInt(page) : 0;
    var num = PAGE_SIZE;

    var fetchUrl;
    if (inputUrl.indexOf("http") === 0) {
        // URL tuyệt đối
        fetchUrl = inputUrl;
    } else if (inputUrl.indexOf("/") === 0) {
        // URL tương đối với server
        fetchUrl = BASE_URL + inputUrl;
    } else {
        // Chuỗi dạng "sort_field:sort_order" cho trang chủ
        var parts = inputUrl.split(":");
        fetchUrl = BASE_URL + "/ajax/search" + libraryPath()
            + "?sort=" + parts[0]
            + "&sort_order=" + (parts[1] || "desc");
    }

    // Thêm phân trang
    var separator = fetchUrl.indexOf("?") >= 0 ? "&" : "?";
    fetchUrl += separator + "num=" + num + "&offset=" + offset;

    var response = calibreFetch(fetchUrl);
    if (response.ok) {
        var data = response.json();
        var bookIds = data.book_ids || [];
        var totalNum = data.total_num || 0;

        if (bookIds.length === 0) {
            return Response.success([], null);
        }

        // Lấy metadata đầy đủ cho các book IDs
        var meta = getBooksMeta(bookIds);
        var books = [];
        for (var i = 0; i < bookIds.length; i++) {
            var id = bookIds[i];
            var m = meta[String(id)] || meta[id];
            if (m) {
                books.push(toBookItem(id, m));
            }
        }

        var next = (offset + num < totalNum) ? String(offset + num) : null;
        return Response.success(books, next);
    }
    return Response.error("Không thể kết nối đến Calibre server tại " + BASE_URL);
}
