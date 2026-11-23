load("config.js");

// genrecontent.js — trả về danh sách truyện theo thể loại
function execute(input, page) {
    page = page || "1";

    // input là URL thể loại (app có thể strip trailing slash)
    var base = (input || "").replace(/\/?$/, "");

    var url;
    if (parseInt(page) <= 1) {
        url = base + "/";
    } else {
        url = base + "/page/" + page + "/";
    }

    var res = fetchPage(url);
    if (!res || !res.ok) return Response.error("HTTP " + (res ? res.status : 0));
    var doc = res.html();

    var items = doc.select("article.mhcv-story-card").map(function(el) {
        var titleEl = el.select(".mhcv-story-card-title a");
        var name = titleEl.text();
        var link = titleEl.attr("href");
        var cover = el.select(".mhcv-story-cover img").attr("src");
        var author = el.select(".mhcv-story-card-meta").text();
        var chips = el.select(".mhcv-story-card-tax span.mhcv-chip");
        var status = chips.size() > 0 ? chips.first().text() : "";
        var tagList = [];
        if (author) tagList.push(author);
        if (status) tagList.push(status);
        for (var i = 1; i < chips.size(); i++) {
            tagList.push(chips.get(i).text());
        }
        return {
            name: name,
            cover: cover,
            link: link,
            description: "",
            tag: tagList.join(" • ")
        };
    });

    var nextEl = doc.select(".nav-links a.next.page-numbers");
    var hasNext = nextEl.size() > 0;

    return Response.success(items, hasNext ? String(parseInt(page) + 1) : "");
}
