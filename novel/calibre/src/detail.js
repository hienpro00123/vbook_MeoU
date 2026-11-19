load('crypto.js');
load('config.js');

function execute(url) {
    var book = parseBook(url);
    if (!book) return Response.error("Địa chỉ sách Calibre không hợp lệ");
    var result = calibreJson(bookPath(book.id, book.library));
    if (result.error) return Response.error(result.error);
    var data = result.data;
    if (!data || !Array.isArray(data.formats)) return Response.error("Metadata sách Calibre không hợp lệ");
    var cover = coverUrl(data.cover);
    if (cover.error) return Response.error(cover.error);
    var tags = [];
    var urls = data.category_urls && data.category_urls.tags || {};
    for (var i = 0; i < (data.tags || []).length; i++) {
        var tag = data.tags[i];
        if (urls[tag]) tags.push({
            title: tag,
            input: JSON.stringify({ library: book.library, path: urls[tag] }),
            script: "genrecontent.js"
        });
    }
    return Response.success({
        name: data.title,
        author: (data.authors || []).join(", "),
        cover: cover.data,
        description: data.comments || "",
        detail: "Định dạng: " + data.formats.join(", ").toUpperCase(),
        url: absolute(bookPath(book.id, book.library)),
        type: "novel",
        format: "novel",
        ongoing: false,
        genres: tags
    });
}
