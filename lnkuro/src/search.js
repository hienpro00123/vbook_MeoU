load("config.js");

function execute(keyword, page) {
    var p = page ? parseInt(page) : 1;
    var q = java.net.URLEncoder.encode(keyword, "UTF-8");
    var url = p <= 1
        ? BASE_URL + "/?s=" + q + "&post_type=wp-manga"
        : BASE_URL + "/page/" + p + "/?s=" + q + "&post_type=wp-manga";

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.success([], null);
    var doc = res.html();
    if (!doc) return Response.success([], null);

    var items = parseCards(doc);
    if (items.length === 0) return Response.success([], null);

    var hasNext = doc.select("a.nextpostslink, a.next, .nav-previous a").size() > 0;
    return Response.success(items, hasNext ? String(p + 1) : null);
}
