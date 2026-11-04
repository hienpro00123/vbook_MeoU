load("config.js");

function execute(url, page) {
  if (!page) page = "0";

  var data = fetchWattpadJson(url, {
    fields: "stories(id,title,url,cover,user(name),completed),nextUrl",
    offset: page,
    limit: "30",
  });

  if (data) {
    if (url.indexOf("completed=1") !== -1 && data.stories) {
      var completedStories = [];
      for (var i = 0; i < data.stories.length; i++) {
        if (data.stories[i].completed) completedStories.push(data.stories[i]);
      }
      data.stories = completedStories;
    }
    return parseStories(data);
  }
  return Response.error("Không thể tải dữ liệu");
}
