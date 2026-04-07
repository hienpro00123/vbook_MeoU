load("config.js");

function execute() {
    return Response.success([
        { title: "Mới cập nhật",     input: API_BASE + "/api/novels?limit=20", script: "homecontent.js" },
        { title: "Đang tiến hành",   input: API_BASE + "/api/novels?status=Ongoing&limit=20", script: "homecontent.js" },
        { title: "Hoàn thành",       input: API_BASE + "/api/novels?status=Completed&limit=20", script: "homecontent.js" }
    ]);
}
