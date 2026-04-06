load("config.js");

function execute() {
    return Response.success([
        { title: "Mới Cập Nhật",      input: "truyen", script: "homecontent.js" },
        { title: "Tìm Theo Thể Loại", input: "",       script: "genre.js" }
    ]);
}