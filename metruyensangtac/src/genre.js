load("config.js");

function execute() {
    return Response.success([
        { title: "Dã Sử",       input: "33",  script: "genrecontent.js" },
        { title: "Cạnh Kỹ",     input: "61",  script: "genrecontent.js" },
        { title: "Học Đường",    input: "117", script: "genrecontent.js" },
        { title: "Tu Tiên",     input: "181", script: "genrecontent.js" },
        { title: "Đô Thị",      input: "19",  script: "genrecontent.js" },
        { title: "Kinh Doanh",  input: "124", script: "genrecontent.js" },
        { title: "Huyền Huyễn", input: "12",  script: "genrecontent.js" },
        { title: "Quân Sự",     input: "146", script: "genrecontent.js" }
    ]);
}
