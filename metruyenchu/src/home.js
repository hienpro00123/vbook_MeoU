load("config.js");

function execute() {
    return Response.success([
        { title: "Truyện Hot",     input: "truyen-hot",  script: "homecontent.js" },
        { title: "Mới cập nhật",   input: "truyen-moi",  script: "homecontent.js" },
        { title: "Hoàn thành",     input: "truyen-full", script: "homecontent.js" },
    ]);
}
