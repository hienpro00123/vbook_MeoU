load("config.js");

// AES-CBC decrypt: site dung MD5(key) -> key[0:16] + iv[16:32]
function aesDecrypt(cipherB64, keyStr) {
    var md5 = java.security.MessageDigest.getInstance("MD5");
    md5.update(new java.lang.String(keyStr).getBytes("UTF-8"));
    var digest = md5.digest();
    var sb = new java.lang.StringBuilder();
    for (var i = 0; i < digest.length; i++) {
        var b = digest[i] & 0xff;
        if (b < 16) sb.append("0");
        sb.append(java.lang.Integer.toHexString(b));
    }
    var md5hex = sb.toString(); // 32 hex chars
    var keyBytes = new java.lang.String(md5hex.substring(0, 16)).getBytes("UTF-8");
    var ivBytes  = new java.lang.String(md5hex.substring(16)).getBytes("UTF-8");

    var secretKey = new Packages.javax.crypto.spec.SecretKeySpec(keyBytes, "AES");
    var ivSpec    = new Packages.javax.crypto.spec.IvParameterSpec(ivBytes);
    var cipher    = Packages.javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding");
    cipher.init(Packages.javax.crypto.Cipher.DECRYPT_MODE, secretKey, ivSpec);

    var cipherBytes = java.util.Base64.getDecoder().decode(cipherB64);
    var plainBytes  = cipher.doFinal(cipherBytes);
    return new java.lang.String(plainBytes, "UTF-8");
}

function execute(url) {
    var fullUrl = url.indexOf("http") === 0 ? url : resolveUrl(url);
    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    // Tim cipher + key trong the <script> cua trang
    var scripts = doc.select("script");
    var pattern = Packages.java.util.regex.Pattern.compile(
        "C0NTENT'\\)\\.html\\(d\\(\"([^\"]+)\",\"([^\"]+)\"\\)\\)"
    );
    var ciphertext = null, key = null;
    for (var i = 0; i < scripts.size(); i++) {
        var matcher = pattern.matcher(scripts.get(i).data());
        if (matcher.find()) {
            ciphertext = matcher.group(1);
            key = matcher.group(2);
            break;
        }
    }

    var html = null;
    if (ciphertext && key) {
        try {
            html = aesDecrypt(ciphertext, key);
        } catch (e) {
            html = null;
        }
    }

    if (html) {
        // Strip promo text bang string replace
        html = html.replace(/<p[^>]*>[^<]*\u672c\u7ae0\u5df2\u9605\u8bfb\u5b8c\u6bd5[^<]*<\/p>/gi, "");
        return Response.success(html);
    }

    // Fallback: browser (bao gom ca truong hop decrypt that bai)
    var browser = Engine.newBrowser();
    try { doc = browser.launch(fullUrl, 12000); } catch (e) { doc = null; }
    try { browser.close(); } catch (e2) {}

    if (!doc) {
        var res2 = fetchRetry(fullUrl);
        if (res2 && res2.ok) doc = res2.html();
    }
    if (!doc) return Response.error("Khong tai duoc noi dung chuong");

    var content = selFirst(doc, "#C0NTENT, .RBGsectionThree-content");
    if (!content) return Response.error("Khong tim thay noi dung chuong");

    content.select("img[src*='/wzbodyimg/']").remove();
    var paragraphs = content.select("p");
    for (var i = 0; i < paragraphs.size(); i++) {
        if (cleanText(paragraphs.get(i).text()).indexOf("\u672c\u7ae0\u5df2\u9605\u8bfb\u5b8c\u6bd5") !== -1) {
            paragraphs.get(i).remove();
        }
    }
    return Response.success(content.html());
}
