load("config.js");

function execute() {
    return Response.success([
        { title: "Tinh phẩm",  input: "index-1", script: "homecontent.js" },
        { title: "Phổ biến",   input: "index-2", script: "homecontent.js" },
        { title: "Cập nhật",   input: "index-3", script: "homecontent.js" },
    ]);
}
