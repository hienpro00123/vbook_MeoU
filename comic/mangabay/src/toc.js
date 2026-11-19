load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    var mangaMatch = url.match(/\/([0-9]+)-[^/]+\.html(?:[?#].*)?$/);
    if (!mangaMatch) return Response.error("URL truyện Manga-Bay không hợp lệ");

    var doc = mangaBayDocument(url);
    var dataText = "";
    doc.select("script").forEach(function (script) {
        if (dataText) return;
        var match = script.html().match(/^\s*window\.__DATA__\s*=\s*(\{[\s\S]*\})\s*;\s*$/);
        if (match) dataText = match[1];
    });
    if (!dataText) return Response.error("Không tìm thấy danh sách chương Manga-Bay");

    var data;
    try {
        data = JSON.parse(dataText);
    } catch (error) {
        return Response.error("Dữ liệu danh sách chương không hợp lệ");
    }
    if (!data || String(data.news_id) !== mangaMatch[1] || !Array.isArray(data.chapters)) {
        return Response.error("Dữ liệu danh sách chương không khớp với truyện");
    }
    if (!data.chapters.length) return Response.error("Truyện chưa có chương");

    var chapters = [];
    var seen = [];
    for (var i = 0; i < data.chapters.length; i++) {
        var chapter = data.chapters[i];
        if (!chapter || !/^\d+$/.test(String(chapter.id)) || !chapter.title) {
            return Response.error("Dữ liệu chương không hợp lệ tại vị trí " + (i + 1));
        }
        var chapterId = String(chapter.id);
        if (seen.indexOf(chapterId) !== -1) continue;
        seen.push(chapterId);
        chapters.push({
            name: chapter.title,
            url: normalizeUrl("/reader/" + mangaMatch[1] + "/" + chapterId),
            description: "",
            lock: false,
            pay: false
        });
    }
    return Response.success(chapters);
}
