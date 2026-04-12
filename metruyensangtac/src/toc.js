load("config.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var slug = extractSlug(storyUrl);
    if (!slug) return Response.error("Không xác định được truyện");

    // Step 1: Fetch raw HTML to get id_truyen from inline script
    var idTruyen = "";
    var totalChapters = 0;

    var res = fetchRetry(storyUrl);
    if (res && res.ok) {
        var rawHtml = res.text();
        if (rawHtml) {
            var idMatch = ID_TRUYEN_RE.exec(rawHtml);
            if (idMatch) idTruyen = idMatch[1];
        }
    }

    // Step 2: Try chapters API if we have id_truyen
    if (idTruyen) {
        var apiHeaders = {
            "User-Agent": FETCH_HEADERS["User-Agent"],
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": FETCH_HEADERS["Accept-Language"],
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": storyUrl
        };
        var body = "id_truyen=" + idTruyen + "&offset=0&limit=5000&order=asc";
        var apiRes = fetch(BASE_URL + "/pages/load_chapters.php", {
            method: "POST",
            headers: apiHeaders,
            body: body
        });
        if (apiRes && apiRes.ok) {
            try {
                var data = apiRes.json();
                if (data && data.chapters) {
                    var chapters = [];
                    var list = data.chapters;
                    for (var i = 0; i < list.length; i++) {
                        var ch = list[i];
                        var chapName = ch.tieude || ch.title || ch.name || ("Chương " + (i + 1));
                        var chapNum = ch.so_chuong || ch.chuong || ch.number || (i + 1);
                        chapters.push({
                            name: chapName,
                            url: BASE_URL + "/read/" + slug + "&chuong=" + chapNum,
                            host: HOST
                        });
                    }
                    if (chapters.length > 0) {
                        return Response.success(chapters);
                    }
                }
                if (data && data.total) {
                    totalChapters = parseInt(data.total, 10);
                }
            } catch (e) {
                // API returned non-JSON (Cloudflare block) — fallback below
            }
        }
    }

    // Step 3: Fallback — use browser to get chapter count from detail page
    if (totalChapters === 0) {
        var browser = Engine.newBrowser();
        var doc = null;
        try {
            doc = browser.launch(storyUrl, 15000);
        } catch (e) {
            doc = null;
        }
        try { browser.close(); } catch (e2) {}

        if (doc) {
            // Look for latest chapter links — the first one has the highest number
            var chapLinks = doc.select("a[href*='chuong=']");
            for (var ci = 0; ci < chapLinks.size(); ci++) {
                var chapHref = chapLinks.get(ci).attr("href") || "";
                var numMatch = /chuong=(\d+)/.exec(chapHref);
                if (numMatch) {
                    var num = parseInt(numMatch[1], 10);
                    if (num > totalChapters) totalChapters = num;
                }
            }

            // Also check text content for chapter count number
            if (totalChapters === 0) {
                var bodyText = doc.body().text();
                var chapCountMatch = /Chương\s*(\d[\d,.]*)/i.exec(bodyText);
                if (chapCountMatch) {
                    var parsed = parseInt(chapCountMatch[1].replace(/[,.]/g, ""), 10);
                    if (parsed > totalChapters) totalChapters = parsed;
                }
            }
        }
    }

    // Step 4: Generate sequential chapter list
    if (totalChapters > 0) {
        var result = [];
        for (var n = 1; n <= totalChapters; n++) {
            result.push({
                name: "Chương " + n,
                url: BASE_URL + "/read/" + slug + "&chuong=" + n,
                host: HOST
            });
        }
        return Response.success(result);
    }

    return Response.error("Không tải được mục lục");
}
