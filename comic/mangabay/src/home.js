function execute() {
    return Response.success([
        { title: "Latest releases", input: "/", script: "search.js" },
        { title: "A-Z", input: "/letters/", script: "search.js" },
        { title: "Manga", input: "/ComicList/or=1/", script: "search.js" },
        { title: "Manhwa", input: "/ComicList/or=3/", script: "search.js" },
        { title: "Manhua", input: "/ComicList/or=2/", script: "search.js" },
        { title: "Webtoon", input: "/ComicList/g=44/", script: "search.js" },
        { title: "Completed", input: "/ComicList/st=1/", script: "search.js" },
        { title: "All titles", input: "/comix/", script: "search.js" }
    ]);
}
