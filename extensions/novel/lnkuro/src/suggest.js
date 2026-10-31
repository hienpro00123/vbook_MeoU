load("config.js");

function execute(input) {
    if (!input) return Response.success([]);

    var data = searchAjax(input, 1);
    if (!data || !data.success) return Response.success([]);

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
    return Response.success(items);
}
