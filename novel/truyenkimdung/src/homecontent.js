load("config.js");

function execute(input, page) {
    var currentPage = parseInt(page || "1", 10);
    if (!currentPage || currentPage < 1) currentPage = 1;
    var url = listUrl(input || "/", currentPage);
    var res = fetch(url);
    if (!res || !res.ok) return Response.error("Không tải được thư viện (HTTP " + (res ? res.status : "không kết nối") + ")");
    var doc = res.html();
    return Response.success(parseStoryList(doc), nextListPage(doc, currentPage));
}
