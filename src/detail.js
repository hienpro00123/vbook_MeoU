load("config.js");

// Chi tiết sách: Lấy thông tin đầy đủ của một cuốn sách từ Calibre
// url = "http://localhost:8080/book/123" (host + link từ list)
function execute(url) {
    var bookId = extractBookId(url);

    var response = calibreFetch("/ajax/book/" + bookId + libraryPath() + "?category_urls=true");
    if (!response.ok) {
        return Response.error("Không thể tải thông tin sách (ID: " + bookId + ")");
    }

    var data = response.json();

    // Xây dựng genres từ tags
    var genres = [];
    if (data.tags && data.tags.length > 0) {
        for (var i = 0; i < data.tags.length; i++) {
            var tag = data.tags[i];
            genres.push({
                title: tag,
                input: "/ajax/search" + libraryPath() + "?q=tags%3A%22" + encodeURIComponent(tag) + "%22&sort=title&sort_order=asc",
                script: "genrecontent.js"
            });
        }
    }

    // Xây dựng suggests từ tác giả (cùng tác giả)
    var suggests = [];
    if (data.authors && data.authors.length > 0) {
        for (var j = 0; j < data.authors.length; j++) {
            var author = data.authors[j];
            suggests.push({
                title: "Cùng tác giả: " + author,
                input: "/ajax/search" + libraryPath() + "?q=authors%3A%22" + encodeURIComponent(author) + "%22&sort=title&sort_order=asc",
                script: "suggest.js"
            });
        }
    }

    // Nếu có series, thêm suggest theo series
    if (data.series) {
        suggests.push({
            title: "Series: " + data.series,
            input: "/ajax/search" + libraryPath() + "?q=series%3A%22" + encodeURIComponent(data.series) + "%22&sort=series_index&sort_order=asc",
            script: "suggest.js"
        });
    }

    // Xây dựng thông tin chi tiết
    var detail = "";
    var formats = data.formats || [];
    if (formats.length > 0) {
        detail += "📁 Định dạng: " + formats.join(", ").toUpperCase() + "\n";
    }
    if (data.publisher) {
        detail += "🏢 NXB: " + data.publisher + "\n";
    }
    if (data.series) {
        detail += "📖 Series: " + data.series;
        if (data.series_index) detail += " #" + data.series_index;
        detail += "\n";
    }
    if (data.languages && data.languages.length > 0) {
        detail += "🌐 Ngôn ngữ: " + data.languages.join(", ") + "\n";
    }
    if (data.rating && data.rating > 0) {
        var stars = "";
        // Calibre lưu rating 0-10 (nửa sao), API trả về đã chia 2 → 0-5
        // Nhưng một số phiên bản trả về 0-10, nên chuẩn hóa
        var ratingVal = data.rating > 5 ? data.rating / 2 : data.rating;
        var ratingRound = Math.round(ratingVal);
        for (var k = 0; k < 5; k++) {
            stars += k < ratingRound ? "★" : "☆";
        }
        detail += "⭐ Đánh giá: " + stars + " (" + ratingVal.toFixed(1) + "/5)\n";
    }
    if (data.identifiers) {
        if (data.identifiers.isbn) {
            detail += "📋 ISBN: " + data.identifiers.isbn + "\n";
        }
    }

    // Cover URL
    var coverUrl = "";
    if (data.cover) {
        coverUrl = BASE_URL + data.cover;
    } else {
        coverUrl = BASE_URL + "/get/cover/" + bookId + libraryPath();
    }

    // Comments/description - Calibre lưu dạng HTML
    var description = data.comments || "";

    return Response.success({
        name: data.title || "Không có tiêu đề",
        cover: coverUrl,
        host: BASE_URL,
        author: (data.authors || []).join(", "),
        description: description,
        detail: detail,
        ongoing: false,
        genres: genres,
        suggests: suggests,
        comments: [{
            title: "Thông tin sách",
            input: "/ajax/book/" + bookId + libraryPath(),
            script: "comment.js"
        }]
    });
}
