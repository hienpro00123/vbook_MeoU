load("config.js");

function execute(url) {
  var doc = fetchDocument(url);
  if (!doc) return Response.error("Không thể tải thông tin video");

  var titleMeta = doc.select("meta[property='og:title']");
  var imageMeta = doc.select("meta[property='og:image']");
  var descriptionMeta = doc.select("meta[name='description']");
  var mediaLinks = doc.select("a[href*='/media/']");
  var name = mediaLinks.size() > 0 ? mediaLinks.get(0).text().trim() : "BiliBili Anime";
  if ((!name || name === "BiliBili Anime") && titleMeta.size() > 0) name = titleMeta.get(0).attr("content");

  var episodes = doc.select(".ep-list a.ep-item[href*='/vi/play/']");
  var description = descriptionMeta.size() > 0 ? descriptionMeta.get(0).attr("content") : "";
  var cover = imageMeta.size() > 0 ? imageMeta.get(0).attr("content") : "";
  return Response.success({
    name: name,
    cover: cover,
    host: BASE_URL,
    author: "BiliBili",
    description: description,
    detail: episodes.size() > 0 ? episodes.size() + " tập" : "Anime",
    ongoing: true,
    genres: [],
    suggests: []
  });
}
