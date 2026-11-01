load("config.js");

function execute() {
    return Response.success([
        { title: "BTV Đề Cử",          input: "home",     script: "homecontent.js" },
        { title: "Chương Mới Cập Nhật", input: "updated",  script: "homecontent.js" },
        { title: "Truyện Mới",          input: "new",      script: "homecontent.js" },
        { title: "Truyện Hoàn Thành",   input: "full",     script: "homecontent.js" }
    ]);
}
