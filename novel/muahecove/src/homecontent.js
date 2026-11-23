load("config.js");

function execute(input, page) {
    page = page || "1";

    var url;
    if (input === "truyen") {
        if (parseInt(page) <= 1) {
            url = BASE_URL + "/truyen/";
        } else {
            url = BASE_URL + "/truyen/page/" + page + "/";
        }
    } else {
        if (parseInt(page) <= 1) {
            url = BASE_URL + "/";
        } else {
            url = BASE_URL + "/page/" + page + "/";
        }
    }

    var res = fetchPage(url);
    if (!res || !res.ok) return Response.error("HTTP " + (res ? res.status : 0));
    var doc = res.html();

    var items = doc.select("article.mhcv-story-card").map(function(el) {
        var titleEl = el.select(".mhcv-story-card-title a");
        var name = titleEl.text();
        var link = titleEl.attr("href");
        var cover = el.select(".mhcv-story-cover img").attr("src");
        var chips = el.select(".mhcv-story-card-tax span.mhcv-chip");
        var status = chips.size() > 0 ? chips.first().text() : "";
        return {
            name: name,
            cover: cover,
            link: link,
            tag: status
        };
    });

    var nextEl = doc.select(".nav-links a.next.page-numbers");
    var hasNext = nextEl.size() > 0;

    return Response.success(items, hasNext ? String(parseInt(page) + 1) : "");
}
