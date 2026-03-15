var BASE_URL = "https://otruyenapi.com/v1/api";
var HOST = "https://otruyen.cc";
var STATUS_MAP = { "ongoing": "Đang phát hành", "completed": "Hoàn thành" };

function extractSlug(url) {
  var slug = url;
  var idx = url.indexOf("/truyen-tranh/");
  if (idx >= 0) slug = url.substring(idx + 14);
  slug = slug.replace(/^\/|\/$/g, "");
  if (slug.indexOf("http") === 0) {
    var parts = slug.split("/");
    slug = parts[parts.length - 1];
  }
  return slug;
}

function resolveThumb(thumb, cdnImage) {
  if (!thumb) return "";
  return thumb.indexOf("http") === 0 ? thumb : cdnImage + "/uploads/comics/" + thumb;
}

function joinArray(val) {
  if (!val || !val.length) return "";
  return Array.isArray(val) ? val.join(", ") : val;
}

function parseGenres(items) {
  var genres = [];
  if (!items) return genres;
  for (var i = 0; i < items.length; i++) {
    genres.push({ title: items[i].name, input: items[i].slug, script: "genrecontent.js" });
  }
  return genres;
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "")
             .replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">")
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&nbsp;/g, " ")
             .trim();
}

function execute(url) {
  var response = fetch(BASE_URL + "/truyen-tranh/" + extractSlug(url));
  if (response.ok) {
    var json = response.json();
    var data = json.data;
    var item = data.item;
    var cdnImage = data.APP_DOMAIN_CDN_IMAGE;

    var thumb = resolveThumb(item.thumb_url, cdnImage);
    var authorName = joinArray(item.author);
    var originName = joinArray(item.origin_name);

    var genres = parseGenres(item.category);

    var description = stripHtml(item.content);

    var details = [];
    if (originName) details.push("Tên khác: " + originName);
    if (item.status && STATUS_MAP[item.status]) details.push("Trạng thái: " + STATUS_MAP[item.status]);

    return Response.success({
      name: item.name,
      cover: thumb,
      host: HOST,
      author: authorName,
      description: description,
      detail: details.join("\n"),
      ongoing: item.status === "ongoing",
      genres: genres,
      suggests: genres.length > 0 ? [{ title: "Truyện cùng thể loại", input: genres[0].input, script: "suggest.js" }] : [],
    });
  }
  return Response.error("Không thể tải thông tin truyện");
}
