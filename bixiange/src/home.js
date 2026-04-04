load("config.js");

function execute() {
    return Response.success([
        { title: "\u6700\u65b0", input: "newest", script: "homecontent.js" },
        { title: "\u70ed\u95e8", input: "sort",   script: "homecontent.js" },
        { title: "\u63a8\u8350", input: "home",   script: "homecontent.js" },
    ]);
}
