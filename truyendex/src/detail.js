load("config.js");

function execute(url) {
  var mangaId = extractUUID(url);

  var response = fetch(API_URL + "/manga/" + mangaId + "?includes[]=artist&includes[]=author&includes[]=cover_art");
  if (response.ok) {
    var data = response.json();
    if (!data || !data.data) return Response.error("Dữ liệu truyện không hợp lệ");
    var attributes = data.data.attributes;
    var relationships = data.data.relationships;

    var cover = getCoverUrl(mangaId, relationships, "512");
    var author = getAuthorFull(relationships);

    var genres = parseTags(attributes.tags);

    var details = [];
    var altNames = getAltTitles(attributes.altTitles);
    if (altNames) details.push("Tên khác: " + altNames);
    if (attributes.status && STATUS_MAP[attributes.status]) details.push("Trạng thái: " + STATUS_MAP[attributes.status]);
    if (attributes.year) details.push("Năm: " + attributes.year);

    return Response.success({
      name: getTitle(attributes.title),
      cover: cover,
      host: BASE_URL,
      author: author,
      description: stripBBCode(getDescription(attributes.description)),
      detail: details.join("\n"),
      ongoing: attributes.status === "ongoing",
      genres: genres,
      suggests: genres.length > 0 ? [{ title: "Truyện cùng thể loại", input: genres[0].input, script: "suggest.js" }] : [],
    });
  }
  return Response.error("Không thể tải thông tin truyện");
}
