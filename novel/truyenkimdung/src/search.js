load("config.js");

function execute(query, page) {
    query = String(query || "").trim();
    if (!query) return Response.success([], null);
    var currentPage = parseInt(page || "1", 10);
    if (!currentPage || currentPage < 1) currentPage = 1;
    var url = listUrl(BASE_URL + "/?q=" + encodeURIComponent(query), currentPage);
    var res = fetch(url);
    if (!res || !res.ok) return Response.error("Không tải được kết quả tìm kiếm (HTTP " + (res ? res.status : "không kết nối") + ")");
    var doc = res.html();
    return Response.success(parseStoryList(doc), nextListPage(doc, currentPage));
}
