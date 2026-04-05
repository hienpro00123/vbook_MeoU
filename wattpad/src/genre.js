load("config.js");

function execute() {
  var genres = [
    // === THỂ LOẠI CHÍNH ===
    { title: "Lãng mạn",            query: "lãng-mạn" },
    { title: "Đam mỹ / BL",         query: "đam-mỹ" },
    { title: "Bách hợp / GL",        query: "bách-hợp" },
    { title: "Ngôn tình",            query: "ngôn-tình" },
    { title: "Học đường",            query: "học-đường" },
    { title: "Hành động",            query: "hành-động" },
    { title: "Hài hước",             query: "hài-hước" },
    { title: "Kinh dị",              query: "kinh-dị" },
    { title: "Bí ẩn / Trinh thám",  query: "trinh-thám" },
    { title: "Phiêu lưu",            query: "phiêu-lưu" },
    { title: "Tiểu thuyết",          query: "tiểu-thuyết" },
    { title: "Fanfiction",           query: "fanfic" },
    // === BỐI CẢNH ===
    { title: "Hiện đại",             query: "hiện-đại" },
    { title: "Cổ đại",               query: "cổ-đại" },
    { title: "Cung đình",            query: "cung-đình" },
    { title: "Lịch sử",              query: "lịch-sử" },
    { title: "Hào môn",              query: "hào-môn" },
    { title: "Giới giải trí",        query: "giới-giải-trí" },
    { title: "Vườn trường",          query: "vườn-trường" },
    // === THỂ LOẠI HUYỀN HUYỄN ===
    { title: "Tu tiên / Tu chân",    query: "tu-chân" },
    { title: "Xuyên không",          query: "xuyên-không" },
    { title: "Xuyên nhanh",          query: "xuyên-nhanh" },
    { title: "Xuyên sách",           query: "xuyên-sách" },
    { title: "Trọng sinh",           query: "trọng-sinh" },
    { title: "Hệ thống",             query: "hệ-thống" },
    { title: "Võng du",              query: "võng-du" },
    { title: "Huyền ảo",             query: "huyền-ảo" },
    { title: "Dị năng",              query: "dị-năng" },
    { title: "Linh dị / Ma",         query: "linh-dị" },
    { title: "Siêu nhiên",           query: "siêu-nhiên" },
    { title: "Võ hiệp",              query: "võ-hiệp" },
    { title: "Khoa học viễn tưởng",  query: "khoa-học-viễn-tưởng" },
    // === CẢM XÚC / TÍNH CHẤT ===
    { title: "Ngọt sủng / HE",       query: "ngọt-sủng" },
    { title: "Sảng văn",             query: "sảng-văn" },
    { title: "Ngọt văn",             query: "ngọt-văn" },
    { title: "Ngược",                query: "ngược" },
    { title: "Tâm lý",               query: "tâm-lý" },
    { title: "Tình cảm",             query: "tình-cảm" },
    { title: "Gia đình",             query: "gia-đình" },
    { title: "Chữa lành",            query: "chữa-lành" },
    { title: "Mạo hiểm",             query: "mạo-hiểm" },
    // === ĐỊNH DẠNG ===
    { title: "Oneshot / Truyện ngắn", query: "oneshot" },
    { title: "Tản văn",              query: "tản-văn" },
    { title: "Thơ",                  query: "thơ" },
    { title: "Chuyển ver",           query: "chuyển-ver" },
  ];

  var list = [];
  for (var i = 0; i < genres.length; i++) {
    var g = genres[i];
    list.push({ title: g.title, input: g.query, script: "genrecontent.js" });
  }
  return Response.success(list);
}

