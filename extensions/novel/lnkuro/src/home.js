load("config.js");

function execute() {
    var tabs = [
        { title: "Mới cập nhật", input: "newupdate", script: "homecontent.js" },
        { title: "Truyện Convert", input: "convert", script: "homecontent.js" },
        { title: "Mới nhất", input: "newest", script: "homecontent.js" }
    ];
    return Response.success(tabs);
}