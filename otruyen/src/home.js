var BASE_URL = "https://otruyenapi.com/v1/api";
var HOST = "https://otruyen.cc";

function execute() {
  return Response.success([
    { title: "Đang phát hành", input: "dang-phat-hanh", script: "homecontent.js" },
    { title: "Hoàn thành",      input: "hoan-thanh",     script: "homecontent.js" },
    { title: "Truyện cập nhật", input: "truyen-moi",     script: "homecontent.js" },
    { title: "Sắp ra mắt",      input: "sap-ra-mat",     script: "homecontent.js" },
  ]);
}
