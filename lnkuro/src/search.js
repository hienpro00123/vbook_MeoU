load("config.js");

function execute(keyword, page) {
    var p = page ? parseInt(page) : 1;
    var data = searchAjax(keyword, p);
    if (!data || !data.success) return Response.success([], null);

    var items = [];
    var arr = data.items || [];
    for (var i = 0; i < arr.length; i++) {
        var it = arr[i];
        items.push({
            name: it.title || "",
            link: it.link || "",
            host: HOST,
            cover: it.cover || ""
        });
    }

    var hasNext = data.has_next === true;
    return Response.success(items, hasNext ? String(p + 1) : null);
}
