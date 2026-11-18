load("config.js");

function execute(url) {
    var bookUrl = absoluteUrl(url);
    if (!bookUrl) return Response.error("Đường dẫn truyện không hợp lệ");
    var res = fetch(bookUrl);
    if (!res || !res.ok) return Response.error("Không tải được truyện (HTTP " + (res ? res.status : "không kết nối") + ")");
    var doc = res.html();
    var name = cleanText(doc.select(".story-title").text());
    var meta = cleanText(doc.select(".story-overview .meta").text());
    var cover = absoluteUrl(doc.select(".story-hero .cover img").attr("src"));
    if (!name && !doc.select(".reader-content").isEmpty()) {
        var libraryRes = fetch(listUrl("/", 1));
        if (!libraryRes || !libraryRes.ok) {
            return Response.error("Không tải được thông tin truyện ngắn (HTTP " + (libraryRes ? libraryRes.status : "không kết nối") + ")");
        }
        var stories = parseStoryList(libraryRes.html());
        var story = null;
        var canonicalBookUrl = String(bookUrl).replace(/[?#].*$/, "").replace(/\/+$/, "");
        for (var i = 0; i < stories.length; i++) {
            if (stories[i].link === canonicalBookUrl) {
                story = stories[i];
                break;
            }
        }
        if (!story) return Response.error("Không tìm thấy thông tin truyện ngắn");
        name = story.name;
        meta = story.tag;
        cover = story.cover;
    }
    if (!name) return Response.error("Không tìm thấy thông tin truyện");
    var version = storyVersion(meta);
    var description = doc.select(".story-description").html();
    return Response.success({
        name: name,
        author: "Kim Dung",
        cover: cover,
        description: description || meta,
        detail: meta,
        url: bookUrl,
        ongoing: meta.indexOf("Hoàn thành") < 0 && version !== "Truyện ngắn",
        tags: version ? [{
            title: version,
            input: "/?version=" + encodeURIComponent(version),
            script: "homecontent.js"
        }] : []
    });
}
