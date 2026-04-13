load("config.js");

function execute(url, page) {
    var currentPage = page ? parseInt(page, 10) : 1;
    var perPage = 20;

    var genreList = fetchJson(BASE_URL + "/wp-json/wp/v2/genre?slug=" + url);
    if (!genreList || genreList.length === 0) return Response.error("Không tìm thấy thể loại");
    var genreId = genreList[0].id;

    var apiUrl = BASE_URL + "/wp-json/wp/v2/manga?genre=" + genreId
        + "&per_page=" + perPage + "&page=" + currentPage
        + "&_embed=wp:featuredmedia";
    var data = fetchJson(apiUrl);
    if (!data) return Response.error("Không tải được danh sách truyện");
    if (data.length === 0) return Response.success([], null);

    var items = [];
    for (var i = 0; i < data.length; i++) {
        var m = data[i];
        var title = (m.title && m.title.rendered) ? m.title.rendered : "";
        if (!title) continue;
        var link = toRelativeUrl(m.link || "");
        if (!link) continue;
        var cover = "";
        var featured = m._embedded && m._embedded["wp:featuredmedia"];
        if (featured && featured.length > 0) {
            cover = featured[0].source_url || "";
        }
        items.push({ name: title, link: link, host: HOST, cover: cover });
    }

    var next = (data.length >= perPage) ? String(currentPage + 1) : null;
    return Response.success(items, next);
}