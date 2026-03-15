load("config.js");

function execute() {
  return Response.success([
    {
      title: "Nổi bật",
      script: "homecontent.js",
      input: API_V3 + "/stories?filter=hot&language=" + LANG_VI,
    },
    {
      title: "Mới nhất",
      script: "homecontent.js",
      input: API_V3 + "/stories?filter=fresh&language=" + LANG_VI,
    },
    {
      title: "Hoàn thành",
      script: "homecontent.js",
      input: API_V3 + "/stories?filter=hot&completed=1&language=" + LANG_VI,
    },
  ]);
}
