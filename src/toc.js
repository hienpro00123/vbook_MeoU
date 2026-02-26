load("config.js");

// TOC: Lấy mục lục (danh sách chương) từ sách
// url = từ page.js, có thể là:
//   - URL manifest: "http://IP:8080/book-manifest/3/EPUB?library_id=xxx"
//   - Chế độ TXT: "txt:123"
//   - Chế độ format khác: "fmt:epub:123"
function execute(url) {

    // Kiểm tra params rỗng (khi test trực tiếp)
    if (!url || url.trim().length === 0) {
        return Response.error("Thiếu tham số URL. Cần chạy qua page.js trước.");
    }

    // === CHẾ ĐỘ TXT ===
    if (url.indexOf("txt:") === 0) {
        var txtBookId = url.substring(4);
        return Response.success([{
            name: "📖 Toàn bộ nội dung",
            url: "/get/txt/" + txtBookId + libraryPath(),
            host: BASE_URL
        }]);
    }

    // === CHẾ ĐỘ FORMAT KHÁC ===
    if (url.indexOf("fmt:") === 0) {
        var fmtParts = url.substring(4).split(":");
        var fmt = fmtParts[0];
        var fmtBookId = fmtParts[1];
        return Response.success([{
            name: "📖 Toàn bộ nội dung (" + fmt.toUpperCase() + ")",
            url: "/get/" + fmt + "/" + fmtBookId + libraryPath(),
            host: BASE_URL
        }]);
    }

    // === CHẾ ĐỘ MANIFEST (EPUB/AZW3/MOBI) ===
    var chapters = [];
    var manifestOk = false;

    try {
        // Gọi book-manifest - lần đầu có thể trigger render job
        var manifest = fetchManifest(url);

        if (manifest) {
            // Trích xuất bookId và format từ URL
            var urlMatch = url.match(/book-manifest\/(\d+)\/([^\?\/]+)/);
            var bookId = urlMatch ? urlMatch[1] : "";
            var bookFmt = urlMatch ? urlMatch[2] : "EPUB";

            // Lấy book_hash (cần size + mtime cho book-file endpoint)
            var bhSize = "";
            var bhMtime = "";
            if (manifest.book_hash) {
                bhSize = String(manifest.book_hash.size || "");
                bhMtime = String(manifest.book_hash.mtime || "");
            }

            // Xây dựng base URL cho book-file
            // Route: /book-file/{book_id}/{fmt}/{size}/{mtime}/{+name}
            var bookFileBase = "/book-file/" + bookId + "/" + bookFmt
                + "/" + bhSize + "/" + bhMtime + "/";

            // Phân tích TOC (mục lục) từ manifest
            if (manifest.toc && manifest.toc.children && manifest.toc.children.length > 0) {
                parseTocChildren(manifest.toc.children, chapters, bookFileBase, 0);
                manifestOk = true;
            }

            // Nếu không có TOC, dùng spine (danh sách file theo thứ tự đọc)
            if (!manifestOk && manifest.spine && manifest.spine.length > 0) {
                for (var i = 0; i < manifest.spine.length; i++) {
                    var spineName = manifest.spine[i];
                    chapters.push({
                        name: "Phần " + (i + 1),
                        url: bookFileBase + spineName + libraryQuery("?"),
                        host: BASE_URL
                    });
                }
                manifestOk = true;
            }
        }
    } catch (e) {
        Console.log("Manifest error: " + e);
    }

    // === FALLBACK: Nếu manifest thất bại, thử đọc trực tiếp ===
    if (!manifestOk || chapters.length === 0) {
        var fallbackMatch = url.match(/book-manifest\/(\d+)/);
        var fallbackBookId = fallbackMatch ? fallbackMatch[1] : "";

        if (fallbackBookId) {
            var bookMeta = calibreFetch("/ajax/book/" + fallbackBookId + libraryPath());
            if (bookMeta.ok) {
                var bookData = bookMeta.json();
                var fmts = bookData.formats || [];

                if (fmts.indexOf("txt") >= 0) {
                    chapters.push({
                        name: "📖 Đọc toàn bộ (TXT)",
                        url: "/get/txt/" + fallbackBookId + libraryPath(),
                        host: BASE_URL
                    });
                }
                if (fmts.indexOf("epub") >= 0) {
                    chapters.push({
                        name: "📖 Đọc toàn bộ (EPUB raw)",
                        url: "/get/epub/" + fallbackBookId + libraryPath(),
                        host: BASE_URL
                    });
                }
                for (var k = 0; k < fmts.length; k++) {
                    if (fmts[k] !== "txt" && fmts[k] !== "epub") {
                        chapters.push({
                            name: "📥 Tải " + fmts[k].toUpperCase(),
                            url: "/get/" + fmts[k] + "/" + fallbackBookId + libraryPath(),
                            host: BASE_URL
                        });
                    }
                }
            }
        }

        if (chapters.length === 0) {
            return Response.error("Không thể tải mục lục. Kiểm tra: 1) Calibre server đã bật, 2) BASE_URL = IP LAN PC (không dùng localhost)");
        }
    }

    return Response.success(chapters);
}

// Gọi book-manifest với hỗ trợ polling (sách cần render lần đầu)
// Calibre render sách ra cache trước khi trả manifest
// Response có thể là: {job_status: "running"} → cần đợi và gọi lại
// Dùng fetch() liên tục (mỗi lần ~100-500ms tự nhiên) thay vì sleep()
function fetchManifest(url) {
    var maxRetries = 30;
    for (var attempt = 0; attempt < maxRetries; attempt++) {
        var response = calibreFetch(url);
        if (!response.ok) {
            Console.log("Manifest fetch failed: " + response.status);
            return null;
        }

        var data = response.json();

        // Kiểm tra xem có phải job status hay manifest thật
        if (data.job_status) {
            if (data.job_status === "finished" && (data.aborted || data.traceback)) {
                Console.log("Render job failed: " + (data.traceback || "aborted"));
                return null;
            }
            // Job đang chạy hoặc vừa xong → fetch lại (latency tự nhiên ~100-500ms)
            Console.log("Render job: " + data.job_status + " (attempt " + (attempt + 1) + "/" + maxRetries + ")");
            // Busy-wait ngắn để không spam server quá nhanh
            busyWait(500);
            continue;
        }

        // Có manifest thật (có toc hoặc spine)
        if (data.toc || data.spine) {
            return data;
        }

        // Response không rõ → thử lại
        busyWait(300);
    }

    Console.log("Manifest timeout after " + maxRetries + " attempts");
    return null;
}

// Busy-wait đơn giản (không cần sleep() API)
// ms ~= thời gian chờ tính bằng millisecond (xấp xỉ)
function busyWait(ms) {
    var start = new Date().getTime();
    while (new Date().getTime() - start < ms) {
        // Đợi
    }
}

// Hàm đệ quy phân tích cây TOC
// bookFileBase = "/book-file/{id}/{fmt}/{size}/{mtime}/"
function parseTocChildren(children, chapters, bookFileBase, level) {
    for (var i = 0; i < children.length; i++) {
        var item = children[i];
        var prefix = "";
        for (var j = 0; j < level; j++) {
            prefix += "  ";
        }
        if (level > 0) prefix += "└ ";

        var chapterUrl = "";
        if (item.dest) {
            // book-file route: /book-file/{bookId}/{fmt}/{size}/{mtime}/{name}
            chapterUrl = bookFileBase + item.dest + libraryQuery("?");
            if (item.frag) {
                chapterUrl += "#" + item.frag;
            }
        }

        if (item.title && chapterUrl) {
            chapters.push({
                name: prefix + item.title,
                url: chapterUrl,
                host: BASE_URL
            });
        }

        // Xử lý con (sub-chapters)
        if (item.children && item.children.length > 0) {
            parseTocChildren(item.children, chapters, bookFileBase, level + 1);
        }
    }
}
