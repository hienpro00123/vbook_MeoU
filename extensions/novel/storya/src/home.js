load("config.js");

function execute() {
    return Response.success([
        { title: "Tất cả truyện", input: "all", script: "homecontent.js" }
    ]);
}
