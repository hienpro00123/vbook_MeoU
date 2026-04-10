load("config.js");

function execute() {
    var genres = [
        { title: "Action", input: "action", script: "genrecontent.js" },
        { title: "Adventure", input: "adventure", script: "genrecontent.js" },
        { title: "Comedy", input: "comedy", script: "genrecontent.js" },
        { title: "Drama", input: "drama", script: "genrecontent.js" },
        { title: "Echi", input: "echi", script: "genrecontent.js" },
        { title: "Fantasy", input: "fantasy", script: "genrecontent.js" },
        { title: "Gender Bender", input: "gender-bender", script: "genrecontent.js" },
        { title: "Harem", input: "harem", script: "genrecontent.js" },
        { title: "Historical", input: "historical", script: "genrecontent.js" },
        { title: "Horror", input: "horror", script: "genrecontent.js" },
        { title: "Mature", input: "mature", script: "genrecontent.js" },
        { title: "Mystery", input: "mystery", script: "genrecontent.js" },
        { title: "Psychological", input: "psychological", script: "genrecontent.js" },
        { title: "Romance", input: "romance", script: "genrecontent.js" },
        { title: "School Life", input: "truyen-han-quoc-hoc-duong", script: "genrecontent.js" },
        { title: "Sci-fi", input: "sci-fi", script: "genrecontent.js" },
        { title: "Seinen", input: "seinen", script: "genrecontent.js" },
        { title: "Shounen", input: "shounen", script: "genrecontent.js" },
        { title: "Slice of Life", input: "slice-of-life", script: "genrecontent.js" },
        { title: "Sport", input: "sport", script: "genrecontent.js" },
        { title: "Supernatural", input: "supernatural", script: "genrecontent.js" },
        { title: "Thriller", input: "thriller", script: "genrecontent.js" },
        { title: "Tragedy", input: "tragedy", script: "genrecontent.js" },
        { title: "Võ Hiệp", input: "vo-hiep", script: "genrecontent.js" },
        { title: "Võ Thuật", input: "vo-thuat", script: "genrecontent.js" },
        { title: "Web Novel", input: "web-novel", script: "genrecontent.js" },
        { title: "Wuxia", input: "wuxia", script: "genrecontent.js" },
        { title: "Yandere", input: "yandere", script: "genrecontent.js" }
    ];
    return Response.success(genres);
}