load("config.js");

function execute() {
    return Response.success([
        { title: "Truyện Tranh",  input: "truyen-tranh",  script: "homecontent.js" },
        { title: "Tiểu Thuyết",  input: "tieu-thuyet",  script: "homecontent.js" }
    ]);
}
