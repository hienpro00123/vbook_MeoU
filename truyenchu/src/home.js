load("config.js");

function execute() {
    return Response.success([
        { name: "Mới Cập Nhật", input: "truyen", script: "homecontent.js" },
        { name: "Tìm Theo Thể Loại", input: "", script: "genre.js" }
    ]);
}
