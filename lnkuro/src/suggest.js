load("config.js");

function execute(input) {
    if (!input) return Response.success([]);

    var q = java.net.URLEncoder.encode(input, "UTF-8");
    var url = BASE_URL + "/?s=" + q + "&post_type=wp-manga";

    var res = fetchRetry(url);
    if (!res || !res.ok) return Response.success([]);
    var doc = res.html();
    if (!doc) return Response.success([]);

    return Response.success(parseCards(doc));
}
