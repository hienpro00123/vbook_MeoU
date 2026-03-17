load("config.js");

function execute(url) {
  var mangaId = extractUUID(url);

  var response = fetchRetry(API_URL + "/manga/" + mangaId + "?includes[]=artist&includes[]=author&includes[]=cover_art&excludedFields[]=attributes.links");
  if (response.ok) {
    var data;
    try { data = response.json(); } catch (e) { return Response.error("Dữ liệu không hợp lệ"); }
    if (!data || !data.data) return Response.error("Dữ liệu truyện không hợp lệ");
    var attributes = data.data.attributes;
    if (!attributes) return Response.error("Dữ liệu truyện không hợp lệ");
    var relationships = data.data.relationships;

    var cover = getCoverUrl(mangaId, relationships, "512");
    var author = getAuthorFull(relationships);
    var authorId = getAuthorId(relationships);

    var genres = parseTags(attributes.tags);

    var details = [];
    var altNames = getAltTitles(attributes.altTitles);
    if (altNames) details.push("Tên khác: " + altNames);
    if (attributes.status && STATUS_MAP[attributes.status]) details.push("Trạng thái: " + STATUS_MAP[attributes.status]);
    if (attributes.year) details.push("Năm: " + attributes.year);

    var suggests = genres.length > 0 ? [{ title: "Truyện cùng thể loại", input: genres[0].input, script: "suggest.js" }] : [];
    if (authorId) suggests.push({ title: "Truyện cùng tác giả", input: "author:" + authorId, script: "suggest.js" });

    return Response.success({
      name: getLocalized(attributes.title),
      cover: cover,
      host: BASE_URL,
      author: author,
      description: stripBBCode(getLocalized(attributes.description)),
      detail: details.join("\n"),
      ongoing: attributes.status === "ongoing",
      genres: genres,
      suggests: suggests,
    });
  }
  return Response.error("Không thể tải thông tin truyện");
}
