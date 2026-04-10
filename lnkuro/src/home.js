function execute() {
    var tabs = [
        { title: "Mới cập nhật", input: "newupdate" },
        { title: "Truyện Convert", input: "convert" },
        { title: "Mới nhất", input: "newest" }
    ];
    return Response.success(tabs);
}
