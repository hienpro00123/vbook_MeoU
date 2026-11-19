load('config.js');
function execute() {
    var doc = mangaBayDocument(BASE_URL + "/");
    var items = mangaBayItems(doc, "main li");

    return Response.success([
        {
            id: "latest",
            title: "Latest releases",
            subtitle: "",
            type: "grid",
            items: items,
            action: { type: "list", script: "search.js", input: "/comix/", data: "" }
        }
    ]);
}
