load("config.js");

function execute() {
    return Response.success([
        { title: "Đề cử",       input: "index-1",     script: "homecontent.js" },
        { title: "Nổi bật",      input: "index-2",     script: "homecontent.js" },
        { title: "Cập nhật",     input: "index-3",     script: "homecontent.js" },
        { title: "Tổng click",   input: "allvisit",    script: "homecontent.js" },
        { title: "Tuần click",   input: "weekvisit",   script: "homecontent.js" },
        { title: "Mới đăng",     input: "postdate",    script: "homecontent.js" },
        { title: "Mới cập nhật", input: "lastupdate",  script: "homecontent.js" },
    ]);
}
