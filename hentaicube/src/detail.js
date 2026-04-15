load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var res = fetchRetry(storyUrl);
    if (!res || !res.ok) return Response.error("Không tải được trang truyện");
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được nội dung trang");

    // Cover - dùng srcset để lấy ảnh gốc (entry cuối cùng)
    var cover = "";
    var imgEl = selFirst(doc, ".summary-image img, .summary_image img");
    if (imgEl) {
        var srcset = imgEl.attr("srcset") || "";
        if (srcset) {
            // srcset: "url1 175w, url2 193w, url3.webp 351w" → lấy entry cuối
            var entries = srcset.split(",");
            var lastEntry = entries[entries.length - 1].replace(/^\s+/, "").split(/\s+/)[0];
            cover = lastEntry || stripSizeSuffix(imgEl.attr("src") || "");
        } else {
            cover = stripSizeSuffix(imgEl.attr("src") || "");
        }
    }

    // Tiêu đề - dùng .ownText() không được trên vBook, dùng cách xóa badge span
    var name = "";
    var h1 = selFirst(doc, "h1.post-title, h1");
    if (h1) {
        var badges = h1.select("span.manga-title-badges");
        for (var bi = 0; bi < badges.size(); bi++) {
            badges.get(bi).remove();
        }
        name = h1.text().replace(/\s+/g, " ").trim();
    }
    if (!name) name = "HentaiCube";

    // Mô tả
    var description = "";
    var descEl = selFirst(doc, ".summary__content p, .description-summary p, .manga-excerpt");
    if (descEl) {
        description = descEl.text().trim();
    }

    // Tình trạng
    var status = "";
    var statusEl = selFirst(doc, ".post-status .summary-content");
    if (statusEl) {
        status = statusEl.text().trim();
    }

    // Thể loại
    var genres = [];
    var seen = {};
    var genreLinks = doc.select("a[href*='/theloai/']");
    for (var gi = 0; gi < genreLinks.size(); gi++) {
        var ga = genreLinks.get(gi);
        var gh = ga.attr("href") || "";
        var gm = GENRE_SLUG_RE.exec(gh);
        if (!gm) continue;
        var slug = gm[1];
        if (seen[slug]) continue;
        seen[slug] = true;
        var gname = ga.text().trim();
        if (!gname) continue;
        genres.push({ title: gname, input: slug, script: "genrecontent.js" });
    }

    var detail = description;
    if (status) detail = (detail ? detail + "\n" : "") + "Tình trạng: " + status;

    return Response.success({
        name: name,
        cover: cover,
        description: detail,
        genres: genres
    });
}
