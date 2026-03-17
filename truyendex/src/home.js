load("config.js");

function execute() {
  var base = API_URL + "/manga?" + MANGA_LIST_PARAMS;
  return Response.success([
    { title: "Mới cập nhật", input: base + "&order[latestUploadedChapter]=desc", script: "homecontent.js" },
    { title: "Đánh giá cao",    input: base + "&order[rating]=desc",                script: "homecontent.js" },
    { title: "Theo dõi nhiều",  input: base + "&order[followedCount]=desc",         script: "homecontent.js" },
  ]);
}
