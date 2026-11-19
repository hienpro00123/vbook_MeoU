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
        if (!chapter || !/^\d+$/.test(String(chapter.id)) || typeof chapter.title !== "string" || !chapter.title) {
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
    chapters.reverse();
    var numbered = [];
    var positions = [];
    for (var j = 0; j < chapters.length; j++) {
        var number = chapters[j].name.match(/\bchap(?:ter)?\.?\s*(\d+(?:\.\d+)*)/i);
        if (number) {
            positions.push(j);
            numbered.push({ chapter: chapters[j], number: number[1].split("."), index: j });
        }
    }
    numbered.sort(function (a, b) {
        var length = Math.min(a.number.length, b.number.length);
        for (var k = 0; k < length; k++) {
            var difference = parseInt(a.number[k], 10) - parseInt(b.number[k], 10);
            if (difference) return difference;
        }
        return a.number.length - b.number.length || a.index - b.index;
    });
    for (var n = 0; n < positions.length; n++) {
        chapters[positions[n]] = numbered[n].chapter;
    }
    return Response.success(chapters);
}
