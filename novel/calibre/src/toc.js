load('crypto.js');
load('config.js');

function execute(url) {
    var book = parseBook(url);
    if (!book) return Response.error("Địa chỉ sách Calibre không hợp lệ");
    var metadata = calibreJson(bookPath(book.id, book.library) + "?category_urls=false");
    if (metadata.error) return Response.error(metadata.error);
    if (!metadata.data || !Array.isArray(metadata.data.formats)) return Response.error("Metadata sách không hợp lệ");
    var format = selectedFormat(metadata.data.formats);
    if (!format) return Response.error("Định dạng chưa hỗ trợ: " + metadata.data.formats.join(", ").toUpperCase());
    var result = manifest(book, format);
    if (result.error) return Response.error(result.error);
    var data = result.data;
    var entries = {};
    var frontTitles = [
        "bìa", "trang bìa", "giới thiệu", "lời giới thiệu", "lời nói đầu", "lời tựa",
        "mục lục", "bản quyền", "thông tin sách",
        "cover", "book cover", "title page", "introduction", "about this book",
        "preface", "foreword", "contents", "table of contents", "copyright", "copyright page",
        "封面", "简介", "簡介", "前言", "序言", "目录", "目錄", "版权", "版權", "书名页", "書名頁"
    ];
    function isFrontTitle(title) {
        var normalized = String(title || "").toLowerCase().replace(/\s+/g, " ")
            .replace(/^[\s.:：\-–—]+|[\s.:：\-–—]+$/g, "");
        return frontTitles.indexOf(normalized) !== -1;
    }
    function entryFor(file) {
        if (!entries[file]) entries[file] = { front: false, title: "" };
        return entries[file];
    }
    function collect(node) {
        if (!node) return;
        if (node.dest && node.title) {
            var entry = entryFor(node.dest);
            if (isFrontTitle(node.title)) entry.front = true;
            else if (!entry.title) entry.title = node.title;
        }
        var children = node.children || [];
        for (var i = 0; i < children.length; i++) collect(children[i]);
    }
    collect(data.toc);
    if (data.title_page_name) entryFor(data.title_page_name).front = true;
    var landmarks = data.landmarks || [];
    for (var j = 0; j < landmarks.length; j++) {
        var landmark = landmarks[j];
        if (landmark.dest && !landmark.frag &&
            /^(cover|titlepage|title-page|toc|copyright-page|introduction|foreword|preface|frontmatter)$/.test(String(landmark.type || "").toLowerCase())) {
            entryFor(landmark.dest).front = true;
        }
    }
    var chapters = [];
    for (var i = 0; i < data.spine.length; i++) {
        var file = data.spine[i];
        var tocEntry = entries[file];
        if (tocEntry && tocEntry.front && !tocEntry.title) continue;
        if (!data.files[file] || !data.files[file].is_html) {
            return Response.error("Calibre trả về phần sách không phải HTML");
        }
        var input = {
            id: book.id, library: book.library, format: format,
            size: data.book_hash.size, mtime: data.book_hash.mtime,
            file: file, link_uid: data.link_uid
        };
        chapters.push({ name: tocEntry && tocEntry.title || "Phần " + (i + 1), url: absolute("/calibre-chapter/" + encodeURIComponent(JSON.stringify(input))) });
    }
    if (!chapters.length) return Response.error("Sách không có chương sau khi lọc phần thông tin");
    return Response.success(chapters);
}
