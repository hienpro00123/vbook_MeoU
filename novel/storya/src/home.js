load("config.js");

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: SITE_PREFIX + "/stories", script: "homecontent.js" },
        { title: "Đọc nhiều", input: SITE_PREFIX + "/stories?sort=reads", script: "homecontent.js" },
        { title: "Đánh giá cao", input: SITE_PREFIX + "/stories?sort=rating", script: "homecontent.js" },
        { title: "A–Z", input: SITE_PREFIX + "/stories?sort=title", script: "homecontent.js" }
    ]);
}
