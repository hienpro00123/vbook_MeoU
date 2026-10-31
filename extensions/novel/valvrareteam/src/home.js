load("config.js");

function execute() {
    return Response.success([
        { title: "Mới cập nhật",     input: BASE_URL + "/api/novels?limit=20", script: "homecontent.js" },
        { title: "Đang tiến hành",   input: BASE_URL + "/api/novels?status=Ongoing&limit=20", script: "homecontent.js" },
        { title: "Hoàn thành",       input: BASE_URL + "/api/novels?status=Completed&limit=20", script: "homecontent.js" }
    ]);
}
