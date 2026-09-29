load("config.js");

function execute() {
  return Response.success([
    { title: "Anime", input: "/vi/anime", script: "homecontent.js" },
    { title: "Thịnh hành", input: "/vi/trending?activeTab=anime", script: "homecontent.js" },
    { title: "Lịch chiếu", input: "/vi/timeline", script: "homecontent.js" }
  ]);
}
