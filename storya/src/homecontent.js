load("config.js");

function execute(url, page) {
    var p = page ? parseInt(page) : 1;
    var json = apiJson("/stories?page=" + p + "&limit=20");
    if (!json || !json.data) return Response.error("");
    var next = (json.meta && p < json.meta.totalPages) ? (p + 1) + "" : null;
    return Response.success(parseStories(json.data), next);
}
