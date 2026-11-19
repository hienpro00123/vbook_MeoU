load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    var doc = mangaBayDocument(url);

    var selectors = ["main img[alt^='Page:']", "#reader img", ".reader img", "[class*=reader] img"];
    var candidates = [];
    for (var i = 0; i < selectors.length; i++) {
        candidates = doc.select(selectors[i]);
        if (!candidates.isEmpty()) break;
    }
    if (candidates.isEmpty()) candidates = doc.select("img");

    var images = [];
    var seen = [];
    candidates.forEach(function (img) {
        var alt = img.attr("alt").toLowerCase();
        var imageUrl = mangaBayImage(img);
        if (!imageUrl || imageUrl.indexOf("data:") === 0 || alt.indexOf("poster") !== -1) return;
        imageUrl = normalizeUrl(imageUrl);
        if (seen.indexOf(imageUrl) === -1) {
            seen.push(imageUrl);
            images.push(imageUrl);
        }
    });
    return Response.success(images);
}
