load("config.js");

// Comments: Hiển thị thông tin metadata bổ sung của sách
// input = URL API book metadata (vd: /ajax/book/123)
// next = phân trang (không dùng)
function execute(input, next) {
    var comments = [];

    var response = calibreFetch(input);
    if (response.ok) {
        var data = response.json();

        // Thông tin format
        if (data.format_metadata) {
            var formatInfo = "";
            var fmts = Object.keys(data.format_metadata);
            for (var i = 0; i < fmts.length; i++) {
                var fmt = fmts[i];
                var fmeta = data.format_metadata[fmt];
                var size = fmeta.size || 0;
                var sizeStr = "";
                if (size > 1048576) {
                    sizeStr = (size / 1048576).toFixed(1) + " MB";
                } else if (size > 1024) {
                    sizeStr = (size / 1024).toFixed(0) + " KB";
                } else {
                    sizeStr = size + " bytes";
                }
                formatInfo += fmt.toUpperCase() + ": " + sizeStr;
                if (i < fmts.length - 1) formatInfo += "\n";
            }
            if (formatInfo) {
                comments.push({
                    name: "📁 Định dạng sách",
                    content: formatInfo,
                    description: ""
                });
            }
        }

        // Identifiers
        if (data.identifiers) {
            var idInfo = "";
            var idKeys = Object.keys(data.identifiers);
            for (var j = 0; j < idKeys.length; j++) {
                idInfo += idKeys[j].toUpperCase() + ": " + data.identifiers[idKeys[j]];
                if (j < idKeys.length - 1) idInfo += "\n";
            }
            if (idInfo) {
                comments.push({
                    name: "🔖 Mã định danh",
                    content: idInfo,
                    description: ""
                });
            }
        }

        // Publisher info
        if (data.publisher) {
            comments.push({
                name: "🏢 Nhà xuất bản",
                content: data.publisher,
                description: data.pubdate || ""
            });
        }

        // Tags
        if (data.tags && data.tags.length > 0) {
            comments.push({
                name: "🏷️ Thẻ",
                content: data.tags.join(", "),
                description: ""
            });
        }

        // Đường dẫn tải xuống
        var downloadLinks = "";
        var formats = data.formats || [];
        for (var k = 0; k < formats.length; k++) {
            downloadLinks += "📥 " + formats[k].toUpperCase() + ": " + BASE_URL + "/get/" + formats[k] + "/" + extractBookId(input) + libraryPath();
            if (k < formats.length - 1) downloadLinks += "\n";
        }
        if (downloadLinks) {
            comments.push({
                name: "📥 Tải xuống",
                content: downloadLinks,
                description: "Copy link để tải sách"
            });
        }
    }

    if (comments.length === 0) {
        comments.push({
            name: "ℹ️ Thông tin",
            content: "Đây là sách từ thư viện Calibre cục bộ",
            description: ""
        });
    }

    return Response.success(comments, null);
}
