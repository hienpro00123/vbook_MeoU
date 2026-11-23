load("config.js");

function execute(url) {
    // App strips trailing slash — add it back for WordPress
    var storyUrl = url.replace(/\/?$/, "/");

    var res = fetchPage(storyUrl);
    if (!res || !res.ok) return Response.error("HTTP " + (res ? res.status : 0));
    var doc = res.html();

    var name = doc.select("article.mhcv-story-detail h1").text();
    var cover = doc.select(".mhcv-story-detail-cover img").attr("src");

    // Tác giả: lấy từ fact đầu tiên, bỏ prefix
    var authorFact = doc.select(".mhcv-story-facts .mhcv-story-fact").first().text();
    var author = authorFact.replace("Tác giả:", "").trim();

    // Mô tả
    var description = doc.select(".mhcv-synopsis").html();
    if (!description) description = "";

    // Trạng thái
    var statusText = doc.select(".mhcv-story-taxonomies a.mhcv-chip[href*='/trang-thai/']").text();
    var ongoing = statusText.indexOf("Hoàn thành") === -1;

    // Tags = thể loại dạng {title, input, script}
    var tags = doc.select(".mhcv-story-taxonomies a.mhcv-chip[href*='/the-loai/']").map(function(el) {
        return {
            title: el.text(),
            input: el.attr("href"),
            script: "genrecontent.js"
        };
    });

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        url: storyUrl,
        ongoing: ongoing,
        tags: tags,
        genres: [],
        suggests: [],
        comments: []
    });
}
