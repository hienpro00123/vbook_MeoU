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
            var descEls = doc.select("h2:matchesOwn(Giới thiệu) ~ p, h2:matchesOwn(Giới thiệu) ~ div");
            if (descEls.size() > 0) {
                var parts = [];
                for (var di = 0; di < descEls.size(); di++) {
                    var t = descEls.get(di).text().trim();
                    if (t && t !== "Xem thêm") {
                        parts.push(t);
                    }
                }
                description = parts.join("\n");
            }
        }

        // Genres — text-based first (scoped to story info), link-based fallback
        var bodyText = doc.text();
        var genreMatch = /Thể loại[:\s]+(.+?)(?=\s*(?:Tình trạng|Lượt đọc|Đánh giá|Giới thiệu|Mục lục|Chương\s*\d))/i.exec(bodyText);
        if (genreMatch) {
            var genreNames = genreMatch[1].split(/[,，\s]+/);
            for (var gi = 0; gi < genreNames.length; gi++) {
                var gn = genreNames[gi].trim();
                if (gn && gn.length > 1) {
                    genres.push({
                        title: gn,
                        input: gn,
                        script: "genrecontent.js"
                    });
                }
                if (genres.length >= 10) break;
            }
        }
        if (genres.length === 0) {
            // Fallback: genre links, but only if reasonable count (<=10)
            var genreLinks = doc.select("a[href*='theloai=']");
            var maxG = genreLinks.size() > 10 ? 10 : genreLinks.size();
            for (var gj = 0; gj < maxG; gj++) {
                var gn2 = genreLinks.get(gj).text().trim();
                if (gn2 && gn2.length > 1) {
                    genres.push({
                        title: gn2,
                        input: gn2,
                        script: "genrecontent.js"
                    });
                }
            }
        }

        // Status
        var bodyText2 = doc.text();
        var statusMatch = /Tình trạng:\s*(Đang ra|Hoàn thành|Full)/i.exec(bodyText2);
        if (statusMatch) {
            var statusText = statusMatch[1].trim();
            if (/Hoàn|Full/i.test(statusText)) ongoing = false;
        }

        // Chapter count for detail
        var chapMatch = /Chương\s*(\d[\d,.]*)/i.exec(bodyText2);
        var chapCount = chapMatch ? chapMatch[1].replace(/[,.]/g, "") : "";
        var viewMatch = /Lượt đọc\s*(\d[\d,.]*)/i.exec(bodyText2);
        var views = viewMatch ? viewMatch[1] : "";
        var ratingMatch = /Đánh giá\s*([\d.]+\/\d+)/i.exec(bodyText2);
        var rating = ratingMatch ? ratingMatch[1] : "";

        var detailParts = [];
        if (chapCount) detailParts.push("Số chương: " + chapCount);
        if (views) detailParts.push("Lượt đọc: " + views);
        if (rating) detailParts.push("Đánh giá: " + rating);
        detail = detailParts.join("\n");

        // Suggests — "Truyện cùng thể loại" or same author stories
        // Build cover map for suggests — img is sibling of <a>
        var sugCoverMap = {};
        var sugAllEls = doc.select("a[href*='/truyen/'], img[src*='/uploads/']");
        var sugLastSlug = "";
        for (var sm = 0; sm < sugAllEls.size(); sm++) {
            var sugEl = sugAllEls.get(sm);
            var sugElHref = sugEl.attr("href") || "";
            var sugElSrc = sugEl.attr("src") || "";
            if (sugElHref && sugElHref.indexOf("/truyen/") !== -1 && !sugElSrc) {
                sugLastSlug = extractSlug(sugElHref) || "";
            } else if (sugElSrc && sugElSrc.indexOf("/uploads/") !== -1) {
                if (sugLastSlug && !sugCoverMap[sugLastSlug]) {
                    var sugImgUrl = sugElSrc;
                    if (sugImgUrl.charAt(0) === "/") sugImgUrl = BASE_URL + sugImgUrl;
                    sugCoverMap[sugLastSlug] = sugImgUrl;
                }
            }
        }

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

            var sCover = sugCoverMap[sSlug] || "";

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
