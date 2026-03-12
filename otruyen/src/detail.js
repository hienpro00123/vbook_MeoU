load("config.js");

function execute(url) {
  var slug = url.replace(/.*\/truyen-tranh\//, "").replace(/\/$/, "");

  var response = fetch(BASE_URL + "/truyen-tranh/" + slug);
  if (response.ok) {
    var json = response.json();
    var item = json.data.item;
    var cdnImage = json.data.APP_DOMAIN_CDN_IMAGE;

    var thumb = item.thumb_url;
    if (thumb && thumb.indexOf("http") !== 0) {
      thumb = cdnImage + "/uploads/comics/" + thumb;
    }

    var authorName = "";
    if (item.author && item.author.length > 0) {
      authorName = Array.isArray(item.author) ? item.author.join(", ") : item.author;
    }

    var genres = [];
    if (item.category) {
      for (var i = 0; i < item.category.length; i++) {
        var cat = item.category[i];
        genres.push({
          title: cat.name,
          input: cat.slug,
          script: "genrecontent.js",
        });
      }
    }

    var isOngoing = item.status === "ongoing";

    var description = item.content || "";
    description = description.replace(/<[^>]*>/g, "");

    var originName = "";
    if (item.origin_name && item.origin_name.length > 0) {
      originName = Array.isArray(item.origin_name) ? item.origin_name.join(", ") : item.origin_name;
    }

    var detail = "";
    if (originName) {
      detail = "Tên khác: " + originName;
    }

    return Response.success({
      name: item.name,
      cover: thumb,
      host: "https://otruyen.cc",
      author: authorName,
      description: description,
      detail: detail,
      ongoing: isOngoing,
      genres: genres,
    });
  }
  return Response.error("Không thể tải thông tin truyện");
}
