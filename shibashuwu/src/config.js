var BASE_URL = "https://www.shibashuwu.net";
var HOST = BASE_URL;
var DEFAULT_COVER = BASE_URL + "/17mb/images/default.jpg";

// Dictionary: wzbodyimg filename -> Chinese character (built from 5 chapters)
var CHAR_MAP = {"02MsqJ":"进","0uS4xD":"子","0V3OC9":"股","1akEaA":"进","1QZcMa":"下","25W7Yx":"口","2E8cGW":"种","2osKP4":"热","3Nbz2K":"汤","3tQ3XF":"身","3tv5lR":"揉","3xWpKV":"液","430VvA":"下","445o0h":"道","4QFbSo":"长","4r4UUq":"嗔","4Xvjje":"点","5nlsYT":"养","5U8uFS":"身","6XVWYn":"廷","71IHUg":"凸","71OjII":"胯","79Cerj":"捏","7hoYmG":"皮","82Krwu":"色","8g4XbX":"根","9qgHPT":"入","Aj1qkS":"出","aulzzg":"裤","B0VM7q":"感","B4sHrA":"羹","B70D9Y":"进","B8NOQx":"汤","BIL3aJ":"酩","BIWkPI":"进","bTieNW":"涌","C15uiP":"子","C1Zig6":"美","c6TmE2":"美","caL5HF":"干","cblvvs":"做","CKgNTx":"唇","Co6pQs":"凸","D3lRLk":"处","d6LYhg":"高","dD7vyR":"深","diWkkJ":"暖","diYIrp":"吟","dl45LB":"凸","dR88TM":"蛋","DyGEhs":"吟","eGcX9K":"腿","EH5U7j":"喷","eKHgIu":"姐","eVYghg":"捏","EYsl8d":"头","ezptKD":"触","fItD7N":"胸","fUiL7X":"出","FxocFK":"饮","Gq41FG":"抽","gXyluJ":"廷","H4tq4e":"魔","hb0zAl":"道","hEJFXm":"养","HJof67":"鸡","HpTyER":"淫","HRnYSf":"种","hU2fy6":"菊","hxsnCq":"口","i7yscQ":"道","iAfDqP":"眼","ICqke5":"粗","ifoKeY":"出","igNn7J":"呻","IQlXen":"棒","iSzJ0M":"紧","JC0hj7":"胸","jcfjHI":"腿","JI7JLH":"皮","JUBTq4":"情","KA4uzN":"骚","kNxKc5":"精","krz68q":"虽","L2ksR1":"涌","lCeF90":"肉","lCRadE":"腿","lMGBO0":"液","LP6A61":"顶","Lw7Q9H":"射","LWOgCk":"物","mG7R7R":"口","mHsuQH":"头","MIuM4Q":"点","mLDrD4":"欢","mPcbFc":"皮","MrdyXc":"身","mTWtSy":"软","mWwYIi":"情","MzAKhy":"肥","n20L2U":"臀","N46dYd":"养","Nd3Zgb":"内","npr93b":"轮","nSaNDx":"奶","nSXWmg":"高","NWMJQM":"做","oEC3UM":"呻","OkVViG":"潮","P0YQ4b":"长","PIQTLP":"户","q32vO3":"乱","q8xsf2":"处","Q9RWfY":"妩","QqVK0B":"高","RfvFqA":"器","rkKq2T":"茎","RR4YFw":"乳","rRJkvI":"软","RSiFfJ":"交","RXHuXE":"肛","rXLMOe":"穴","s9TKC8":"按","SkD6ZG":"舌","sLKjsU":"串","sNqsTD":"部","SwwF7X":"深","tDTUOJ":"淫","TH2sXL":"花","tqdPlE":"长","tsy5qu":"滑","TXhTYn":"裤","u197E5":"浓","u20wtt":"咬","ul3i0s":"口","uSAy3X":"点","uSn7cH":"合","uwvUTT":"长","VckAQC":"春","vpZzIB":"股","vtE2Oh":"戴","Vvapmh":"下","W3RqrR":"润","WgBY4H":"顶","wizdPe":"体","WzOp03":"裸","x5zI4m":"精","X7TlHF":"体","XcJBYv":"潮","Xdmj2l":"水","XE49XK":"水","XfHT0X":"马","xPoIaD":"尻","y3mnbZ":"姐","y6Ku0H":"交","Y7MhRX":"姐","YB1HyO":"裸","YDCcYU":"阴","ykrSsv":"美","Ymqi1n":"头","YNxRDZ":"流","YODoVs":"鸡","yPjCem":"爱","YVWEww":"色","Z5f6Wa":"稼","zaw9hq":"乳","zg7ZHu":"强","zQ6gqJ":"逼","zxfQjD":"出","zZaUct":"奸"};

var FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.5",
    "Referer": BASE_URL + "/"
};
var FETCH_OPTIONS = { headers: FETCH_HEADERS };

var BOOK_RE = /\/book\/\d+\/?$/;
var CHAPTER_RE = /\/book\/\d+\/\d+\.html$/;
var CATEGORY_LINK_RE = /\/category\/(\d+)\/?$/;
var WRITER_RE = /\/writer\/\d+\/?$/;

var CATEGORY_TABS = [
    { title: "全部", input: "category:0" },
    { title: "完本", input: "finish:0" },
    { title: "耽美轻文", input: "category:1" },
    { title: "耽美辣文", input: "category:2" },
    { title: "言情轻文", input: "category:3" },
    { title: "言情辣文", input: "category:4" },
    { title: "女女百合", input: "category:5" },
    { title: "超爽辣文", input: "category:6" },
    { title: "男男辣文", input: "category:7" },
    { title: "浓情辣文", input: "category:8" },
    { title: "私密趣事", input: "category:9" },
    { title: "评书品书", input: "category:10" }
];

function selFirst(el, css) {
    var items = el.select(css);
    return items.size() > 0 ? items.get(0) : null;
}

function cleanText(text) {
    return (text || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function resolveUrl(url) {
    if (!url) return BASE_URL;
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    return BASE_URL + (url.charAt(0) === "/" ? url : "/" + url);
}

function stripHost(url) {
    var full = resolveUrl(url);
    if (full.indexOf(BASE_URL) === 0) return full.substring(BASE_URL.length);
    return full;
}

function cloneHeaders() {
    return {
        "User-Agent": FETCH_HEADERS["User-Agent"],
        "Accept": FETCH_HEADERS["Accept"],
        "Accept-Language": FETCH_HEADERS["Accept-Language"],
        "Referer": FETCH_HEADERS["Referer"]
    };
}

function fetchRetry(url, options) {
    var opt = options || FETCH_OPTIONS;
    var res = fetch(url, opt);
    if (!res) return res;
    if (!res.ok && !(res.status >= 400 && res.status < 500)) {
        res = fetch(url, opt);
    }
    return res;
}

function buildPostOptions(body) {
    var headers = cloneHeaders();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    return {
        method: "POST",
        headers: headers,
        body: body
    };
}

function extractCover(el) {
    var imgEl = selFirst(el, "img[_src], img[data-src], img[data-original], img[src]");
    if (!imgEl) return DEFAULT_COVER;

    var lazy = imgEl.attr("_src") || imgEl.attr("data-src") || imgEl.attr("data-original") || "";
    var src = lazy || imgEl.attr("src") || "";
    src = resolveUrl(src);
    if (src.indexOf("/17mb/images/enter.png") !== -1) return DEFAULT_COVER;
    return src || DEFAULT_COVER;
}

function buildCategoryUrl(input, pageNum) {
    var parts = (input || "category:0").split(":");
    var mode = parts[0];
    var categoryId = parts.length > 1 ? parts[1] : "0";
    var path = mode === "finish" ? "/category/finish/" + categoryId + "/" : "/category/" + categoryId + "/";

    if (pageNum > 1) {
        path += pageNum + ".html";
    }

    return BASE_URL + path;
}

function buildGenre(categoryText, categoryHref) {
    var match = CATEGORY_LINK_RE.exec(resolveUrl(categoryHref));
    if (!match) return null;
    return {
        title: cleanText(categoryText),
        input: "category:" + match[1],
        script: "genrecontent.js"
    };
}

function pushItem(result, seen, name, href, cover, description) {
    var full = resolveUrl(href);
    if (!BOOK_RE.test(full)) return;

    var link = stripHost(full);
    if (seen[link]) return;
    seen[link] = true;

    result.push({
        name: cleanText(name),
        link: link,
        host: HOST,
        cover: cover || DEFAULT_COVER,
        description: cleanText(description)
    });
}

function parseThumbItems(root) {
    var result = [];
    var seen = {};
    var items = root.select("li");

    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        var titleA = selFirst(item, "div.book_img_name a[href*='/book/'], a[href*='/book/'][title], a[href*='/book/']");
        if (!titleA) continue;

        var href = titleA.attr("href") || "";
        var name = cleanText(titleA.text() || titleA.attr("title"));
        if (!name || name === "阅读本书") continue;

        pushItem(result, seen, name, href, extractCover(item), "");
    }

    return result;
}

function parseCategoryItems(doc) {
    var result = [];
    var seen = {};
    var units = doc.select(".CGsectionTwo-right-content-unit");

    for (var i = 0; i < units.size(); i++) {
        var unit = units.get(i);
        var titleA = selFirst(unit, "a.title[href*='/book/'], p a[href*='/book/']");
        if (!titleA) continue;

        var name = cleanText(titleA.text());
        if (!name || name === "阅读本书") continue;

        var authorA = selFirst(unit, "a[href*='/writer/']");
        var description = authorA ? "作者: " + cleanText(authorA.text()) : "";
        var paragraphs = unit.select("p");
        if (paragraphs.size() > 2) {
            var summary = cleanText(paragraphs.get(2).text());
            if (summary) description = description ? description + " / " + summary : summary;
        }

        pushItem(result, seen, name, titleA.attr("href"), extractCover(unit), description);
    }

    if (result.length > 0) return result;
    return parseThumbItems(doc);
}

function getCategoryNextPage(doc, pageNum) {
    var nextA = selFirst(doc, "a:matchesOwn(下页), a:matchesOwn(下一页)");
    return nextA ? String(pageNum + 1) : null;
}

function executeCategory(input, page) {
    var pageNum = parseInt(page || "1", 10);
    if (!pageNum || pageNum < 1) pageNum = 1;

    var catUrl = buildCategoryUrl(input, pageNum);
    var doc = null;

    var browser = Engine.newBrowser();
    try {
        doc = browser.launch(catUrl, 12000);
    } catch (e) {
        doc = null;
    }
    try { browser.close(); } catch (e2) {}

    if (!doc) {
        var res = fetchRetry(catUrl);
        if (res && res.ok) doc = res.html();
    }

    if (!doc) {
        return Response.error("Khong tai duoc danh sach truyen");
    }

    return Response.success(parseCategoryItems(doc), getCategoryNextPage(doc, pageNum));
}

function parseSearchItems(doc) {
    var result = [];
    var seen = {};
    var paragraphs = doc.select("p");

    for (var i = 0; i < paragraphs.size(); i++) {
        var p = paragraphs.get(i);
        var bookA = selFirst(p, "a[href*='/book/']");
        if (!bookA) continue;

        var name = cleanText(bookA.text());
        if (!name || name === "阅读本书") continue;

        var authorA = selFirst(p, "a[href*='/writer/']");
        var categoryA = null;
        var links = p.select("a[href]");
        for (var li = 0; li < links.size(); li++) {
            var link = links.get(li);
            var href = resolveUrl(link.attr("href") || "");
            if (CATEGORY_LINK_RE.test(href)) {
                categoryA = link;
                break;
            }
        }

        var description = "";
        if (categoryA) description += "[" + cleanText(categoryA.text()) + "] ";
        if (authorA) description += cleanText(authorA.text());

        pushItem(result, seen, name, bookA.attr("href"), DEFAULT_COVER, description);
    }

    return result;
}

function collectSuggests(doc, currentUrl) {
    var result = [];
    var seen = {};
    var links = doc.select("a[href*='/book/']");
    var current = resolveUrl(currentUrl);

    for (var i = 0; i < links.size(); i++) {
        var link = links.get(i);
        var href = resolveUrl(link.attr("href") || "");
        if (!BOOK_RE.test(href) || href === current) continue;

        var name = cleanText(link.text() || link.attr("title"));
        if (!name || name === "阅读本书") continue;

        var key = stripHost(href);
        if (seen[key]) continue;
        seen[key] = true;

        result.push({
            name: cleanText(name),
            link: key,
            host: HOST
        });

        if (result.length >= 12) break;
    }

    return result;
}
