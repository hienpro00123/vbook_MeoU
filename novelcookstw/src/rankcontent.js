load("config.js");

function execute(url) {
    var json = fetchApi("/novel/rank/fanqie");
    if (!json || json.code !== 200) return Response.error("Tải bảng xếp hạng thất bại");
    var rankList = json.data;
    if (!rankList) return Response.error("Không có dữ liệu xếp hạng");

    var result = [];
    var seen = {};
    for (var i = 0; i < rankList.length; i++) {
        var rankGroup = rankList[i];
        var books = rankGroup.books;
        if (!books) continue;
        for (var j = 0; j < books.length; j++) {
            var book = books[j];
            if (!book.my_novel_id || !book.title) continue;
            var id = book.my_novel_id;
            if (seen[id]) continue;
            seen[id] = true;
            result.push({
                name: book.title,
                link: BASE_URL + "/novel.html?articleid=" + id,
                host: BASE_URL,
                cover: coverUrl(id),
                description: book.author || ""
            });
        }
    }

    if (result.length === 0) return Response.error("Không có tiểu thuyết trong bảng xếp hạng");
    return Response.success(result);
}
