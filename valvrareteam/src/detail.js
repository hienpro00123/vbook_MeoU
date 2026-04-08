load("config.js");

function execute(url) {
    var novelId = extractNovelId(url);
    if (!novelId) return Response.error("URL không hợp lệ");

    var data = fetchApiJson("/api/novels/" + novelId);
    if (!data || !data.novel) return Response.error("Không tìm thấy truyện");

    var novel = data.novel;

    // Genres → vBook genre list
    var genres = [];
    var rawGenres = novel.genres || [];
    for (var gi = 0; gi < rawGenres.length; gi++) {
        genres.push({
            title: rawGenres[gi],
            input: rawGenres[gi],
            script: "genrecontent.js"
        });
    }

    // Đếm tổng chương
    var totalChaps = 0;
    var modules = data.modules || [];
    for (var mi = 0; mi < modules.length; mi++) {
        var chaps = modules[mi].chapters || [];
        totalChaps += chaps.length;
    }

    var statusTxt = mapStatus(novel.status);
    var detailTxt = "Số chương: " + totalChaps;
    if (novel.alternativeTitles && novel.alternativeTitles.length > 0) {
        detailTxt = "Tên khác: " + novel.alternativeTitles[0] + "\n" + detailTxt;
    }
    if (novel.illustrator) {
        detailTxt = detailTxt + "\nHọa sĩ: " + novel.illustrator;
    }

    return Response.success({
        name: novel.title || "",
        cover: novel.illustration || "",
        host: SITE_URL,
        author: novel.author || "",
        description: stripHtml(novel.description || ""),
        detail: detailTxt,
        ongoing: novel.status === "Ongoing",
        genres: genres,
        suggests: [{ title: "Gợi ý", input: url, script: "suggest.js" }],
        comments: [{ title: "Bình luận", input: novelId, script: "comment.js" }]
    });
}

