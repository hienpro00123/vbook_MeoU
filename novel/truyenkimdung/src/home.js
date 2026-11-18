load("config.js");

function execute() {
    return Response.success([
        { title: "Tất cả", input: "/", script: "homecontent.js" },
        { title: "Tân tu", input: "/?version=" + encodeURIComponent("Tân tu"), script: "homecontent.js" },
        { title: "Bản cũ", input: "/?version=" + encodeURIComponent("Bản cũ"), script: "homecontent.js" },
        { title: "Truyện ngắn", input: "/?version=" + encodeURIComponent("Truyện ngắn"), script: "homecontent.js" }
    ]);
}
