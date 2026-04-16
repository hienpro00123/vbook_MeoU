load("config.js");

function execute(url) {
    var fullUrl = url.indexOf("http") === 0 ? url : resolveUrl(url);
    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    var content = selFirst(doc, "#C0NTENT, .RBGsectionThree-content");
    if (!content) return Response.error("Khong tim thay noi dung chuong");

    // Thay the moi <img wzbodyimg/X.png> bang ky tu tuong ung tu CHAR_MAP
    var imgs = content.select("img[src*='/wzbodyimg/']");
    for (var i = 0; i < imgs.size(); i++) {
        var img = imgs.get(i);
        var src = String(img.attr("src"));
        var slash = src.lastIndexOf("/");
        var dot = src.lastIndexOf(".");
        var name = (slash >= 0 && dot > slash) ? src.substring(slash + 1, dot) : "";
        var ch = name && CHAR_MAP[name] ? CHAR_MAP[name] : "";
        img.replaceWith(new Packages.org.jsoup.nodes.TextNode(ch, ""));
    }

    // Xoa dong quang cao
    var paras = content.select("p");
    for (var i = 0; i < paras.size(); i++) {
        if (cleanText(paras.get(i).text()).indexOf("\u672c\u7ae0\u5df2\u9605\u8bfb\u5b8c\u6bd5") !== -1) {
            paras.get(i).remove();
        }
    }

    return Response.success(content.html());
}
    var md5 = java.security.MessageDigest.getInstance("MD5");
    md5.update(new java.lang.String(keyStr).getBytes("UTF-8"));
    var digest = md5.digest();
    var sb = new java.lang.StringBuilder();
    for (var i = 0; i < digest.length; i++) {
        var b = digest[i] & 0xff;
        if (b < 16) sb.append("0");
        sb.append(java.lang.Integer.toHexString(b));
    }
    var md5hex = sb.toString();
    // iv = md5[0:16], aesKey = md5[16:32] (theo CryptoJS logic)
    var ivBytes  = new java.lang.String(md5hex.substring(0, 16)).getBytes("UTF-8");
    var keyBytes = new java.lang.String(md5hex.substring(16)).getBytes("UTF-8");

    var sk = new Packages.javax.crypto.spec.SecretKeySpec(keyBytes, "AES");
    var iv = new Packages.javax.crypto.spec.IvParameterSpec(ivBytes);
    var c  = Packages.javax.crypto.Cipher.getInstance("AES/CBC/PKCS5Padding");
    c.init(Packages.javax.crypto.Cipher.DECRYPT_MODE, sk, iv);
    var raw = java.util.Base64.getDecoder().decode(cipherB64);
    return new java.lang.String(c.doFinal(raw), "UTF-8");
}

// Sync: thay the tung <img wzbodyimg> bang ky tu tuong ung tu decryptedHtml
function syncImgsToChars(contentEl, decryptedHtml) {
    var TextNodeCls = Packages.org.jsoup.nodes.TextNode;
    var ElementCls  = Packages.org.jsoup.nodes.Element;
    var decDoc  = Packages.org.jsoup.Jsoup.parseBodyFragment(decryptedHtml);
    var decParas = decDoc.body().select("p");
    var sParas   = contentEl.select("p");

    for (var i = 0; i < sParas.size(); i++) {
        var sp = sParas.get(i);
        if (i >= decParas.size()) {
            sp.select("img[src*='/wzbodyimg/']").remove();
            continue;
        }
        // decText: xoa \n phat sinh tu <br> de khong lech vi tri
        var decText = String(decParas.get(i).text()).replace(/\n/g, "");
        var pos = 0;

        var nodeArr = new java.util.ArrayList(sp.childNodes());
        for (var j = 0; j < nodeArr.size(); j++) {
            var node = nodeArr.get(j);
            if (node instanceof TextNodeCls) {
                pos += String(node.text()).replace(/\n/g, "").length;
            } else if (node instanceof ElementCls) {
                var el = node;
                if (String(el.tagName()) === "img" &&
                    String(el.attr("src")).indexOf("/wzbodyimg/") >= 0) {
                    if (pos < decText.length) {
                        el.replaceWith(new TextNodeCls(decText.substring(pos, pos + 1), ""));
                        pos++;
                    } else {
                        el.remove();
                    }
                }
            }
        }
    }
}

function execute(url) {
    var fullUrl = url.indexOf("http") === 0 ? url : resolveUrl(url);
    var res = fetchRetry(fullUrl);
    if (!res || !res.ok) return Response.error("Khong tai duoc chuong");
    var doc = res.html();
    if (!doc) return Response.error("Khong doc duoc noi dung");

    var content = selFirst(doc, "#C0NTENT, .RBGsectionThree-content");
    if (!content) return Response.error("Khong tim thay noi dung chuong");

    // Tim cipher + key trong script (dung indexOf, khong dung regex)
    var scripts = doc.select("script");
    var ciphertext = null, key = null;
    for (var i = 0; i < scripts.size(); i++) {
        var data = String(scripts.get(i).data());
        var marker = "C0NTENT').html(d(\"";
        var idx = data.indexOf(marker);
        if (idx < 0) continue;
        var rest = data.substring(idx + marker.length);
        var sep = rest.indexOf("\",\"");
        if (sep < 0) continue;
        ciphertext = rest.substring(0, sep);
        var after = rest.substring(sep + 3);
        var ek = after.indexOf("\"");
        if (ek < 0) continue;
        key = after.substring(0, ek);
        break;
    }

    if (ciphertext && key) {
        try {
            syncImgsToChars(content, aesDecrypt(ciphertext, key));
        } catch (e) {
            content.select("img[src*='/wzbodyimg/']").remove();
        }
    } else {
        content.select("img[src*='/wzbodyimg/']").remove();
    }

    // Xoa dong quang cao
    var paras = content.select("p");
    for (var i = 0; i < paras.size(); i++) {
        if (cleanText(paras.get(i).text()).indexOf("\u672c\u7ae0\u5df2\u9605\u8bfb\u5b8c\u6bd5") !== -1) {
            paras.get(i).remove();
        }
    }
    return Response.success(content.html());
}
