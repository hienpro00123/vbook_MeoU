load("config.js");

function execute() {
    return Response.success([
        { title: "Cap nhat", input: BASE_URL + "/", script: "homecontent.js" },
        { title: "Truyen full", input: BASE_URL + "/completed", script: "homecontent.js" },
        { title: "Manhwa", input: BASE_URL + "/genre/manhwa", script: "homecontent.js" },
        { title: "Manga", input: BASE_URL + "/genre/manga", script: "homecontent.js" },
        { title: "Manhua", input: BASE_URL + "/genre/manhua", script: "homecontent.js" }
    ]);
}