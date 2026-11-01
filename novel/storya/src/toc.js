load("config.js");

function execute(url) {
    var slug = extractSlug(url);
    var chapters = [];
    var p = 1;
    var total = 1;
    do {
        var json = apiJson("/chapters/story/" + slug + "?page=" + p + "&limit=100&minimal=true");
        if (!json || !json.data || json.data.length === 0) break;
        for (var i = 0; i < json.data.length; i++) {
            var ch = json.data[i];
            chapters.push({ name: ch.title || ("Chương " + ch.order), url: slug + "/" + ch.slug, host: HOST });
        }
        total = json.meta ? json.meta.totalPages : 1;
        p++;
    } while (p <= total);
    return Response.success(chapters);
}
