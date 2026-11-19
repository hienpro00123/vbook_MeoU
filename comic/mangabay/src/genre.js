load('config.js');
function execute() {
    var result = mangaBayGenreData();
    if (result.error) return Response.error(result.error);
    return Response.success(result.genres);
}
