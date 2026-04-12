load("config.js");

function loadDoc(pageUrl) {
    var doc = null;
    var browser = Engine.newBrowser();
    try {
        doc = browser.launch(pageUrl, 15000);
    } catch (e) {
        doc = null;
    }
    try { browser.close(); } catch (e2) {}
    return doc;
}

function execute(url) {
    var storyUrl = resolveUrl(url);
    var slug = extractSlug(storyUrl);

    // Detail page is CSR — need browser to render
    var doc = loadDoc(storyUrl);

    var name = "";
    var cover = "";
    var author = "";
    var description = "";
    var detail = "";
    var ongoing = true;
    var genres = [];
    var suggests = [];

    if (doc) {
        // Title — h1
        var h1 = selFirst(doc, "h1");
        if (h1) name = h1.text().trim();

        // Cover — img with story cover
        var coverImg = selFirst(doc, "img[alt*='truyện'], img[alt*='Ảnh truyện']");
        if (!coverImg) {
            // Fallback: largest image in main content area
            var imgs = doc.select("img[src*='/uploads/']");
            for (var ci = 0; ci < imgs.size(); ci++) {
                var imgSrc = imgs.get(ci).attr("src") || "";
                if (imgSrc.indexOf("banner") === -1 && imgSrc.indexOf("logo") === -1) {
                    coverImg = imgs.get(ci);
                    break;
                }
            }
        }
        if (coverImg) {
            cover = coverImg.attr("data-src") || coverImg.attr("src") || "";
        }
        if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;

        // Author — link with key= param
        var authorLink = selFirst(doc, "a[href*='key=']");
        if (authorLink) author = authorLink.text().trim();

        // Description — from meta tag (always available in raw HTML)
        var metaDesc = selFirst(doc, "meta[property='og:description']");
        if (metaDesc) {
            description = metaDesc.attr("content") || "";
        }
        if (!description) {
            // Try from rendered page
            var descHeading = doc.select("h2:matchesOwn(Giới thiệu)");
            if (descHeading.size() > 0) {
                var descParent = descHeading.get(0).parent();
                if (descParent) {
                    var ps = descParent.select("p, span, div");
                    var parts = [];
                    for (var di = 0; di < ps.size(); di++) {
                        var t = ps.get(di).text().trim();
                        if (t && t.indexOf("Giới thiệu") === -1 && t !== "Xem thêm") {
                            parts.push(t);
                        }
                    }
                    description = parts.join("\n");
                }
            }
        }

        // Genres — text nodes after "Thể loại: "
        var bodyText = doc.body().text();
        var genreMatch = /Thể loại:\s*(.+?)(?:Tác Phẩm|Tình trạng|Chương|$)/i.exec(bodyText);
        if (genreMatch) {
            var genreText = genreMatch[1].trim();
            var genreNames = genreText.split(/[,，]\s*/);
            for (var gi = 0; gi < genreNames.length; gi++) {
                var gn = genreNames[gi].trim();
                if (gn) {
                    genres.push({
                        title: gn,
                        input: gn,
                        script: "genrecontent.js"
                    });
                }
            }
        }

        // Status
        var statusMatch = /Tình trạng:\s*(Đang ra|Hoàn thành|Full)/i.exec(bodyText);
        if (statusMatch) {
            var statusText = statusMatch[1].trim();
            if (/Hoàn|Full/i.test(statusText)) ongoing = false;
        }

        // Chapter count for detail
        var chapMatch = /Chương\s*(\d[\d,.]*)/i.exec(bodyText);
        var chapCount = chapMatch ? chapMatch[1].replace(/[,.]/g, "") : "";
        var viewMatch = /Lượt đọc\s*(\d[\d,.]*)/i.exec(bodyText);
        var views = viewMatch ? viewMatch[1] : "";
        var ratingMatch = /Đánh giá\s*([\d.]+\/\d+)/i.exec(bodyText);
        var rating = ratingMatch ? ratingMatch[1] : "";

        var detailParts = [];
        if (chapCount) detailParts.push("Số chương: " + chapCount);
        if (views) detailParts.push("Lượt đọc: " + views);
        if (rating) detailParts.push("Đánh giá: " + rating);
        detail = detailParts.join("\n");

        // Suggests — "Truyện cùng thể loại" or same author stories
        var suggestLinks = doc.select("a[href*='/truyen/']");
        var suggestSeen = {};
        suggestSeen[slug] = true;
        for (var si = 0; si < suggestLinks.size(); si++) {
            var sa = suggestLinks.get(si);
            var sHref = sa.attr("href") || "";
            var sSlug = extractSlug(sHref);
            if (!sSlug || suggestSeen[sSlug]) continue;
            if (sHref.indexOf("index.php") !== -1) continue;

            var sName = sa.text().trim();
            if (!sName || sName === "Logo" || sName.length < 2) continue;
            if (sName.indexOf("Banner") !== -1) continue;

            suggestSeen[sSlug] = true;

            var sCover = "";
            var sImg = selFirst(sa, "img");
            if (sImg) {
                sCover = sImg.attr("src") || "";
                if (sCover && sCover.charAt(0) === "/") sCover = BASE_URL + sCover;
            }

            suggests.push({
                name: sName,
                link: "/truyen/" + sSlug,
                host: HOST,
                cover: sCover
            });
            if (suggests.length >= 10) break;
        }
    }

    // Fallback: try meta tags from raw HTML fetch if browser failed
    if (!name) {
        var res = fetchRetry(storyUrl);
        if (res && res.ok) {
            var rawDoc = res.html();
            if (rawDoc) {
                var ogTitle = selFirst(rawDoc, "meta[property='og:title']");
                if (ogTitle) {
                    name = (ogTitle.attr("content") || "").replace(/^MeTruyenSangTac\s*-\s*/, "").trim();
                }
                var ogImage = selFirst(rawDoc, "meta[property='og:image']");
                if (ogImage && !cover) {
                    cover = ogImage.attr("content") || "";
                    if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;
                }
                var ogDesc = selFirst(rawDoc, "meta[name='description']");
                if (ogDesc && !description) {
                    description = ogDesc.attr("content") || "";
                }
            }
        }
    }

    if (!name) return Response.error("Không tải được thông tin truyện");

    return Response.success({
        name: name,
        cover: cover,
        host: HOST,
        author: author || "Unknown",
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        comments: []
    });
}
