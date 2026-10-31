load("config.js");

function execute(url) {
    var json = apiJson("/stories/" + extractSlug(url));
    if (!json || !json.data) return Response.error("Không tải được thông tin truyện");
    var s = json.data;
    var genres = [];
    if (s.genres) {
        for (var i = 0; i < s.genres.length; i++) {
            genres.push({ title: s.genres[i].name, input: s.genres[i].id + "", script: "genrecontent.js" });
        }
    }
    return Response.success({
        name: s.title || "",
        link: "/truyen/" + s.slug,
        host: HOST,
        cover: resolveCover(s.coverUrl),
        author: s.author ? s.author.name : "",
        description: s.rewrittenDescription || s.description || "",
        genre: genres,
        status: s.status === "COMPLETED" ? "Hoàn thành" : s.status === "ONGOING" ? "Đang ra" : "",
        detail: (s.totalChapters ? "Số chương: " + s.totalChapters : "") + (s.viewCount ? (s.totalChapters ? " | " : "") + "Lượt xem: " + s.viewCount : "")
    });
}
