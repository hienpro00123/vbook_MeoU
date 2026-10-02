load("config.js");

function execute(url) {
  url = absoluteUrl(url);
  var response = fetch(url, FETCH_OPTIONS);
  if (!response || !response.ok) return Response.error("Khong tai duoc thong tin anime BiliBili");
  var doc;
  try { doc = response.html(); } catch (e) { return Response.error("Trang anime BiliBili khong hop le"); }
  var titleMeta = doc.select("meta[property='og:title']");
  var coverMeta = doc.select("meta[property='og:image']");
  var descriptionMeta = doc.select("meta[name='description']");
  var title = titleMeta.size() ? titleMeta.get(0).attr("content") : "BiliBili Anime";
  var cover = coverMeta.size() ? coverMeta.get(0).attr("content") : "";
  var description = descriptionMeta.size() ? descriptionMeta.get(0).attr("content") : "";
  return Response.success({
    name: title,
    cover: cover,
    host: BASE_URL,
    type: "video",
    format: "series",
    author: "BiliBili",
    description: description,
    detail: "Anime",
    ongoing: true,
    url: url,
    genres: [],
    suggests: []
  });
}
