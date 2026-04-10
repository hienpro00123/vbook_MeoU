function execute(input, page) {
    var p = parseInt(page) || 1;
    var url = "";

    if (input === "newupdate") {
        url = BASE_URL + "/truyen-han-quoc/" + (p > 1 ? "?krp=" + p : "");
    } else if (input === "convert") {
        url = BASE_URL + "/truyen-convert/" + (p > 1 ? "?krp=" + p : "");
    } else if (input === "newest") {
        url = BASE_URL + "/truyen-moi-nhat/" + (p > 1 ? "?krp=" + p : "");
    } else {
        url = BASE_URL + "/truyen-han-quoc/" + (p > 1 ? "?krp=" + p : "");
    }

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.error("Fetch error: " + url);

    var doc = res.parse();
    var items = parseCards(doc);

    if (items.length === 0) return Response.success([]);

    // Check next page
    var hasNext = false;
    var nextLinks = doc.select("a[href*='krp=" + (p + 1) + "']");
    if (nextLinks.size() > 0) hasNext = true;

    if (hasNext) {
        return Response.success(items, p + 1);
    }
    return Response.success(items);
}
