load("config.js");

function execute(key, page) {
    var p = page ? parseInt(page) : 1;
    var json = apiJson("/stories/search?q=" + encodeURIComponent(key) + "&page=" + p + "&limit=20");
    if (!json || !json.data) return Response.success([], null);
    var next = (json.meta && p < json.meta.totalPages) ? (p + 1) + "" : null;
    return Response.success(parseStories(json.data), next);
}
