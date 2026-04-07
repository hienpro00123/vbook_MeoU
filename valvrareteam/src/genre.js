load("config.js");

function execute() {
    var genres = [
        "Action", "Adventure", "Comedy", "Drama", "Fantasy",
        "Historical", "Horror", "Isekai", "Magic", "Mecha",
        "Mystery", "Psychological", "Romance", "School Life",
        "Science Fiction", "Seinen", "Shoujo", "Shounen",
        "Slice of Life", "Supernatural", "Tragedy",
        "Japanese Novel", "Chinese Novel", "Korean Novel", "Vietnamese Novel",
        "Web Novel", "Character Growth", "Harem", "Ecchi"
    ];

    var items = [];
    for (var i = 0; i < genres.length; i++) {
        items.push({
            title: genres[i],
            input: API_BASE + "/api/novels?genre=" + encodeURIComponent(genres[i]) + "&limit=20",
            script: "genrecontent.js"
        });
    }
    return Response.success(items);
}
