load("config.js");

function execute(input) {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/?order_by=update_time&sort=desc", script: "homecontent.js" }
    ]);
}
