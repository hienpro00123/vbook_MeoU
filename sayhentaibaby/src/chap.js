load("config.js");

function testUrl(url) {
    if (!url) return false;
    try {
        var res = fetch(url, FETCH_OPTIONS);
        return res != null && res.ok;
    } catch (e) {
        return false;
    }
}

function execute(url) {
    var chapUrl = url.indexOf("http") === 0 ? url : resolveUrl(url);
    var res = fetchRetry(chapUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung chuong");

    // div.contentimg > div.imageload > img.simg[src]
    var imgs = doc.select("div.contentimg img.simg");
    if (imgs.size() === 0) {
        imgs = doc.select("div.contentimg img");
    }
    if (imgs.size() === 0) return Response.error("Khong co anh trong chuong");

    // Thu thap URL cac server cho tung anh
    var sv1List = [];
    var sv2List = [];
    var sv3List = [];
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        sv1List.push(img.attr("src") || img.attr("data-sv1") || "");
        sv2List.push(img.attr("data-sv2") || "");
        sv3List.push(img.attr("data-sv3") || "");
    }

    // Phat hien server tot nhat bang cach test anh dau tien
    var useServer = 1;
    if (!testUrl(sv1List[0])) {
        if (testUrl(sv2List[0])) {
            useServer = 2;
        } else if (testUrl(sv3List[0])) {
            useServer = 3;
        }
    }

    var data = [];
    for (var j = 0; j < sv1List.length; j++) {
        var src;
        if (useServer === 2 && sv2List[j]) {
            src = sv2List[j];
        } else if (useServer === 3 && sv3List[j]) {
            src = sv3List[j];
        } else {
            src = sv1List[j];
        }
        if (!src || src.indexOf("data:image") === 0) continue;
        data.push({ link: src });
    }

    if (data.length === 0) return Response.error("Khong co anh hop le trong chuong");
    return Response.success(data);
}
