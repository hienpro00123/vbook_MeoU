load("config.js");

function execute() {
    return Response.success([
        { title: "Nổi Bật",    input: "/novel/hot",            script: "homecontent.js" },
        { title: "Kỳ Huyễn",   input: "/novel/list?sortid=1",  script: "homecontent.js" },
        { title: "Tiên Hiệp",  input: "/novel/list?sortid=2",  script: "homecontent.js" },
        { title: "Khoa Huyễn", input: "/novel/list?sortid=3",  script: "homecontent.js" },
        { title: "Đô Thị",     input: "/novel/list?sortid=4",  script: "homecontent.js" },
        { title: "Tu Chân",    input: "/novel/list?sortid=5",  script: "homecontent.js" },
        { title: "Cao Vũ",     input: "/novel/list?sortid=6",  script: "homecontent.js" },
        { title: "Lịch Sử",    input: "/novel/list?sortid=7",  script: "homecontent.js" },
        { title: "Chiến Thần", input: "/novel/list?sortid=8",  script: "homecontent.js" }
    ]);
}
