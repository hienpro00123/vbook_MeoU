function execute() {
    return Response.success([
        { title: "Thư viện", input: "/library.html", script: "homecontent.js" },
        { title: "Hoàn thành", input: "/full.html", script: "homecontent.js" },
        { title: "Mới cập nhật", input: "/ranking/update.html", script: "homecontent.js" }
    ]);
}
