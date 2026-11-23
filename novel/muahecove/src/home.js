function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "", script: "homecontent.js" },
        { title: "Kho truyện",   input: "truyen", script: "homecontent.js" }
    ]);
}
