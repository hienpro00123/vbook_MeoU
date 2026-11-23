load("config.js");

// genre.js — danh sách thể loại (gọi không có args từ app)
function execute() {
    // Thử parse genres từ trang chủ (menu navigation)
    var res = fetchPage(BASE_URL + "/");
    if (res && res.ok) {
        var doc = res.html();
        var seen = {};
        var result = [];

        doc.select("a[href*='/the-loai/']").map(function(el) {
            var href = el.attr("href");
            var title = el.text().trim();
            if (!title || !href || href === BASE_URL + "/the-loai/") return null;
            if (seen[href]) return null;
            seen[href] = true;
            result.push({
                title: title,
                input: href,
                script: "genrecontent.js"
            });
            return null;
        });

        if (result.length > 0) {
            return Response.success(result);
        }
    }

    // Fallback: danh sách thể loại cố định
    return Response.success([
        { title: "Cổ đại",        input: BASE_URL + "/the-loai/co-dai/",        script: "genrecontent.js" },
        { title: "Hiện đại",      input: BASE_URL + "/the-loai/hien-dai/",      script: "genrecontent.js" },
        { title: "Ngôn tình",     input: BASE_URL + "/the-loai/ngon-tinh/",     script: "genrecontent.js" },
        { title: "Chính kịch",    input: BASE_URL + "/the-loai/chinh-kich/",    script: "genrecontent.js" },
        { title: "Hài hước",      input: BASE_URL + "/the-loai/hai-huoc/",      script: "genrecontent.js" },
        { title: "Huyền huyễn",   input: BASE_URL + "/the-loai/huyen-huyen/",   script: "genrecontent.js" },
        { title: "Tiên hiệp",     input: BASE_URL + "/the-loai/tien-hiep/",     script: "genrecontent.js" },
        { title: "Dân quốc",      input: BASE_URL + "/the-loai/dan-quoc/",      script: "genrecontent.js" },
        { title: "HE",            input: BASE_URL + "/the-loai/he/",            script: "genrecontent.js" },
        { title: "Đang tiến hành",input: BASE_URL + "/trang-thai/dang-tien-hanh/", script: "genrecontent.js" },
        { title: "Hoàn thành",    input: BASE_URL + "/trang-thai/hoan-thanh/",  script: "genrecontent.js" }
    ]);
}
