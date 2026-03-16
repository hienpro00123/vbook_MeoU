load("config.js");

function execute(url) {
  var response = fetch(url);
  if (!response.ok) return Response.error("Không thể tải mục lục");

  var data = response.json();
  var chapters = [];
  if (!data || !data.data || data.data.length === 0) return Response.success(chapters);

  // Fetch additional pages if manga has >500 chapters
  var allData = data.data;
  var fetched = data.offset + data.data.length;
  var baseUrl = url.replace(/&offset=\d+$/, "");
  var maxPages = 20; // guard: tối đa 20 request (10000 chương), tránh loop vô hạn khi mạng kém
  var pageCount = 0;
  while (fetched < data.total && pageCount < maxPages) {
    pageCount++;
    var nextResp = fetch(baseUrl + "&offset=" + fetched);
    if (!nextResp.ok) {
      // Retry 1 lần trước khi bỏ qua — xử lý packet drop tạm thời trên 5G
      nextResp = fetch(baseUrl + "&offset=" + fetched);
      if (!nextResp.ok) break;
    }
    var nextData = nextResp.json();
    if (!nextData || !nextData.data || nextData.data.length === 0) break;
    for (var n = 0; n < nextData.data.length; n++) {
      allData.push(nextData.data[n]);
    }
    fetched += nextData.data.length;
  }

  // Deduplicate: keep chapter with most pages per volume+chapter key
  var seen = {};
  var items = [];
  for (var i = 0; i < allData.length; i++) {
    var item = allData[i];
    if (item.type !== "chapter") continue;
    var attr = item.attributes;
    // Skip external chapters (MangaPlus etc.) — no images on MangaDex
    if (attr.externalUrl && attr.pages === 0) continue;
    // Use chapter id for oneshots to avoid merging unrelated chapters
    var key = (!attr.volume && !attr.chapter) ? item.id : (attr.volume || "") + "-" + (attr.chapter || "");
    if (seen[key] !== undefined) {
      var prev = items[seen[key]];
      if (attr.pages > prev.attributes.pages) {
        items[seen[key]] = item;
      }
      continue;
    }
    seen[key] = items.length;
    items.push(item);
  }

  for (var k = 0; k < items.length; k++) {
    var ch = items[k];
    var groupName = getGroupName(ch.relationships);
    chapters.push({
      name: buildChapterTitle(ch.attributes, groupName),
      url: ch.id,
    });
  }

  return Response.success(chapters);
}
