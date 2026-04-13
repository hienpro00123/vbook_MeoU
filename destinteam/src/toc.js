load("config.js");

var CHAPTERS_PER_PAGE = 50;

function buildChapterName(item) {
    if (!item) return "";
    var number = item.number || 0;
    var title = normalizeSpace(item.title || "");
    if (number && title) return "Chap " + number + ": " + title;
    if (number) return "Chap " + number;
    return title;
}

function fetchChaptersPage(mangaId, pageNum) {
    var apiUrl = BASE_URL + "/wp-json/initmanga/v1/chapters?manga_id=" + mangaId + "&per_page=" + CHAPTERS_PER_PAGE + "&paged=" + pageNum;
    return fetchJson(apiUrl);
}

function execute(url) {
    var detailUrl = resolveUrl(url);
    var doc = fetchDoc(detailUrl);
    if (!doc) return Response.error("Không tải được mục lục");

    var mangaId = getMangaId(doc);
    if (!mangaId) return Response.error("Không tìm thấy manga_id");

    var firstPage = fetchChaptersPage(mangaId, 1);
    if (!firstPage || !firstPage.items || firstPage.items.length === 0) return Response.error("Không tải được danh sách chương");

    var chapters = [];
    var normalizedDetailUrl = detailUrl.replace(/\/+$/, "");
    var totalPages = parseInt(firstPage.total_pages, 10) || 1;

    function pushItems(items) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (!item || !item.slug) continue;

            chapters.push({
                name: buildChapterName(item),
                url: (normalizedDetailUrl + "/" + item.slug + "/").replace(BASE_URL, ""),
                host: HOST
            });
        }
    }

    pushItems(firstPage.items);
    for (var pageNum = 2; pageNum <= totalPages; pageNum++) {
        var pageData = fetchChaptersPage(mangaId, pageNum);
        if (!pageData || !pageData.items || pageData.items.length === 0) continue;
        pushItems(pageData.items);
    }

    var ordered = [];
    for (var j = chapters.length - 1; j >= 0; j--) {
        ordered.push(chapters[j]);
    }

    return Response.success(ordered);
}