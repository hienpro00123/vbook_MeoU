load("config.js");

function execute(url, page) {
    var p = parseInt(page) || 1;
    var fullUrl = BASE_URL + "/the-loai/" + url + "/" + (p > 1 ? "?krp=" + p : "");

    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Fetch error: " + fullUrl);

    var doc = res.html();
    var items = parseCards(doc);

    if (items.length === 0) return Response.success([]);

    var hasNext = false;
    var nextLinks = doc.select("a[href*='krp=" + (p + 1) + "']");
    if (nextLinks.size() > 0) hasNext = true;

    if (hasNext) {
        return Response.success(items, p + 1);
    }
    return Response.success(items);
}
