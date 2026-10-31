load("config.js");

function execute() {
    return Response.success([
        { title: "Đề cử",       input: "index-1",     script: "homecontent.js" },
        { title: "Nổi bật",      input: "index-2",     script: "homecontent.js" },
        { title: "Cập nhật",     input: "index-3",     script: "homecontent.js" }
    ]);
}
