var BASE_URL = "https://otruyenapi.com/v1/api";
var CDN_IMAGE = "https://img.otruyenapi.com";

function execute() {
  return Response.success([
    { title: "Truyện mới cập nhật", input: "truyen-moi", script: "homecontent.js" },
    { title: "Sắp ra mắt", input: "sap-ra-mat", script: "homecontent.js" },
    { title: "Đang phát hành", input: "dang-phat-hanh", script: "homecontent.js" },
    { title: "Hoàn thành", input: "hoan-thanh", script: "homecontent.js" },
  ]);
}
