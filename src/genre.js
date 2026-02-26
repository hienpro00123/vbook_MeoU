load("config.js");

// Thể loại: chỉ hiển thị danh sách từ khóa (tags)
function execute() {
    var genres = [];

    var catResponse = calibreFetch("/ajax/categories" + libraryPath());
    if (!catResponse.ok) return Response.success(genres);
    var categories = catResponse.json();
    if (!categories || categories.length === 0) return Response.success(genres);

    // Tìm URL tags (hex: 74616773)
    var tagsUrl = null;
    for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        if (cat.is_category && cat.url && cat.url.indexOf("74616773") >= 0) {
            tagsUrl = cat.url;
            break;
        }
    }

    if (tagsUrl) {
        var resp = calibreFetch(tagsUrl + "?num=500&sort=name&sort_order=asc");
        if (resp.ok) {
            var data = resp.json();
            if (data && data.items) {
                for (var j = 0; j < data.items.length; j++) {
                    var item = data.items[j];
                    genres.push({
                        title: item.name + " (" + item.count + ")",
                        input: item.url,
                        script: "genrecontent.js"
                    });
                }
            }
        }
    }

    return Response.success(genres);
}
