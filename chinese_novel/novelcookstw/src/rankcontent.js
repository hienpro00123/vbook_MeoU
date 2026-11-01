load("config.js");
var RANK_PAGE_SIZE = 20;

function collectRank(rankName) {
    var r = fetchApi("/novel/rank/fanqie");
    if (!r.json) return { error: r.error };

    var json = r.json;
    if (json.code !== 200) return { error: "Tải bảng xếp hạng thất bại" };

    var groups = json.data;
    if (!groups || !groups.length) return { error: "Không có dữ liệu" };

    var result = [], seen = {};
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        if (rankName && group.rank_name !== rankName) continue;
        var books = group.books;
        if (!books || !books.length) continue;
        for (var j = 0; j < books.length; j++) {
            var b = books[j];
            var id = b.my_novel_id || b.articleid;
            var name = b.title || b.articlename;
            if (!id || !name || seen[id]) continue;
            seen[id] = true;

            var desc = b.author || "";
            if (group.category_name) desc = desc ? desc + " · " + group.category_name : group.category_name;
            result.push({
                name: name,
                link: BASE_URL + "/novel.html?articleid=" + id,
                host: BASE_URL,
                cover: coverUrl(id),
                description: desc
            });
        }
    }
    return { items: result };
}

function execute(rankName, page) {
    var collected = collectRank(rankName || "");
    if (collected.error) return Response.error(collected.error);

    var all = collected.items;
    if (!all.length) return Response.error("Không có dữ liệu");

    var p = parseInt(page, 10) || 1;
    var start = (p - 1) * RANK_PAGE_SIZE;
    if (start >= all.length) return Response.success([], null);

    var end = start + RANK_PAGE_SIZE;
    if (end > all.length) end = all.length;
    var next = end < all.length ? String(p + 1) : null;
    return Response.success(all.slice(start, end), next);
}
