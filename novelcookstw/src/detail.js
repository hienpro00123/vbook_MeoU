load("config.js");
function execute(url) {
    var id = parseArticleId(url);
    if (!id) return Response.error("Không đọc được articleid từ URL");
    var json = fetchApi("/novel/detail/" + id);
    if (!json || json.code !== 200) return Response.error("Tải chi tiết thất bại");
    var d = json.data;
    var genres = [];
    if (d.tag_list) {
        for (var i = 0; i < d.tag_list.length; i++) {
            genres.push(d.tag_list[i].keyword);
        }
    }
    var ongoing = d.fullflag === "0" || d.fullflag === 0;
    return Response.success({
        name: d.articlename || "",
        cover: coverUrl(id),
        host: BASE_URL,
        author: d.author || "",
        description: d.intro || "",
        detail: "",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
