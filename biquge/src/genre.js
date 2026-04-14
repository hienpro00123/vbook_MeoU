load("config.js");

function execute() {
    return Response.success([
        { title: "Huyền huyễn", input: "xuanhuan", script: "genrecontent.js" },
        { title: "Võ hiệp",     input: "wuxia",    script: "genrecontent.js" },
        { title: "Đô thị",      input: "dushi",    script: "genrecontent.js" },
        { title: "Lịch sử",     input: "lishi",    script: "genrecontent.js" },
        { title: "Khoa viễn",    input: "kehuan",   script: "genrecontent.js" },
        { title: "Game",         input: "youxi",    script: "genrecontent.js" },
        { title: "Nữ sinh",     input: "nvsheng",  script: "genrecontent.js" },
        { title: "Khác",        input: "qita",     script: "genrecontent.js" },
    ]);
}
