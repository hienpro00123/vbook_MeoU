load("config.js");

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "moi-cap-nhat", script: "homecontent.js" },
        { title: "Truyện mới", input: "truyen", script: "homecontent.js" },
        { title: "Đang thịnh hành", input: "dang-thinh-hanh", script: "homecontent.js" },
        { title: "Hoàn thành", input: "truyen-da-hoan-thanh", script: "homecontent.js" },
        { title: "Đánh giá cao", input: "truyen-duoc-danh-gia-cao-nhat", script: "homecontent.js" },
        { title: "Danh sách A-Z", input: "danh-sach-a-z", script: "homecontent.js" }
    ]);
}