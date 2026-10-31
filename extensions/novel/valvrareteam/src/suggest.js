load("config.js");

function execute(url) {
    return parseNovels(BASE_URL + "/api/novels?limit=10", null);
}
