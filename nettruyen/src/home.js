load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",  input: BASE_URL + "/trang-chu",        script: "homecontent.js" },
        { title: "Truyện Hot",    input: BASE_URL + "/truyen-tranh-hot",  script: "homecontent.js" },
        { title: "Tất Cả",        input: BASE_URL + "/tim-truyen",        script: "homecontent.js" }
    ]);
}
