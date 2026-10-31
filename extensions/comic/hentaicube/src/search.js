load("config.js");

function execute(keyword, page) {
    var q = encodeURIComponent(keyword);
    var fetchUrl = BASE_URL + "/?s=" + q + "&post_type=wp-manga";

    var res = fetchRetry(fetchUrl);
    if (!res || !res.ok) return Response.success([], null);
    var doc = res.html();
    if (!doc) return Response.success([], null);

    // Trang search dùng .c-tabs-item__content thay vì .page-item-detail
    var items = [];
    var seen = {};
    var cards = doc.select(".c-tabs-item__content");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var titleA = selFirst(card, ".post-title h3 a, .post-title a");
        if (!titleA) continue;
        var name = titleA.text().trim();
        var link = titleA.attr("href") || "";
        if (!link || seen[link]) continue;
        seen[link] = true;

        var imgEl = selFirst(card, ".tab-thumb img, img");
        var cover = imgEl ? stripSizeSuffix(imgEl.attr("src") || "") : "";

        items.push({ name: name, link: link, host: HOST, cover: cover });
    }

    return Response.success(items, null);
}
