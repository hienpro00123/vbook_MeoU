load("config.js");

function execute(url) {
    var bookUrl = absoluteUrl(url);
    if (!bookUrl) return Response.error("Đường dẫn truyện không hợp lệ");
    var res = fetch(bookUrl);
    if (!res || !res.ok) return Response.error("Không tải được truyện (HTTP " + (res ? res.status : "không kết nối") + ")");
    var doc = res.html();
    var name = doc.select("h1.booktitle").text().trim();
    if (!name) return Response.error("Không tìm thấy thông tin truyện");
    return Response.success({
        name: name,
        author: doc.select(".booktag a[href^='/search/']").text().trim(),
        cover: doc.select(".bookcover img").attr("src") || "",
        description: doc.select(".bookintro").html(),
        url: bookUrl,
        ongoing: !/完结|全本/.test(doc.select(".booktag").text())
    });
}
