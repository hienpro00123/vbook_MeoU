var SITE_URL = "https://truyendex.cc/nettrom";

function execute() {
  return Response.success([
    { title: "Mới cập nhật", input: "latestUploadedChapter", script: "homecontent.js" },
    { title: "Mới thêm gần đây", input: "createdAt", script: "homecontent.js" },
    { title: "Đánh giá cao", input: "rating", script: "homecontent.js" },
    { title: "Theo dõi nhiều", input: "followedCount", script: "homecontent.js" },
  ]);
}
