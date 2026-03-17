load("config.js");

function execute(url) {
  var response = fetchRetry(BASE_URL + "/truyen-tranh/" + extractSlug(url));
  if (response.ok) {
    var json;
    try { json = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    var data = json && json.data;
    if (!data || !data.item) return Response.error("Dữ liệu không hợp lệ");
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

    var suggests = genres.length > 0 ? [{ title: "Truyện cùng thể loại", input: genres[0].input, script: "suggest.js" }] : [];
    var authorSlug = (item.author && item.author.length > 0) ? slugifyVN(item.author[0]) : "";
    if (authorSlug) suggests.push({ title: "Truyện cùng tác giả", input: "author:" + authorSlug, script: "suggest.js" });

    return Response.success({
      name: item.name,
      cover: thumb,
      host: HOST,
      author: authorName,
      description: description,
      detail: details.join("\n"),
      ongoing: item.status === "ongoing",
      genres: genres,
      suggests: suggests,
    });
  }
  return Response.error("Không thể tải thông tin truyện");
}
