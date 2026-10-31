---
name: vbook-extensions
description: >-
  Master skill for developing, testing, debugging, and publishing vBook extensions.
  Use this skill when creating new extensions, modifying existing ones, fixing bugs
  in JS scripts, running tests via CLI, building ZIPs, or publishing to the catalog.
  Covers all extension types: novel, comic, video, audio, tts, translate.
---

# VBook Extension Development — Master Skill

> [!IMPORTANT]
> **Luôn đọc skill này trước khi viết/sửa bất kỳ dòng code extension nào.**
> Đây là tài liệu quy chuẩn duy nhất cho toàn bộ quy trình phát triển extension vBook.

---

## 1. Tổng quan Kiến trúc

VBook extensions là các plugin JavaScript chạy trên **Rhino engine** (ES6 safe subset) trong app vBook.
Mỗi extension bao gồm:

```
extension-folder/
├── plugin.json      ← manifest (metadata, script mapping, config)
├── icon.png         ← icon 200×200
├── src/
│   ├── search.js    ← tìm kiếm
│   ├── detail.js    ← chi tiết truyện/phim
│   ├── toc.js       ← danh sách chương/tập
│   ├── chap.js      ← nội dung chương
│   ├── home.js      ← trang chủ (optional)
│   ├── explore.js   ← khám phá (optional)
│   ├── genre.js     ← thể loại (optional)
│   ├── track.js     ← phát video/audio (video/audio type)
│   ├── page.js      ← danh sách ảnh comic (comic type)
│   └── config.js    ← config helper (optional)
└── test.json        ← test data
```

### Extension Types & Required Scripts

| Script   | `novel` | `comic` | `audio` | `video` | `tts` | `translate` |
|----------|:-------:|:-------:|:-------:|:-------:|:-----:|:-----------:|
| search   |    ✓    |    ✓    |    ✓    |    ✓    |   —   |      —      |
| detail   |    ✓    |    ✓    |    ✓    |    ✓    |   —   |      —      |
| toc      |    ✓    |    ✓    |    ✓    |    ✓    |   —   |      —      |
| chap     |    ✓    |    ○    |    ✓    |    ○    |   —   |      —      |
| page     |    —    |    ○    |    —    |    —    |   —   |      —      |
| track    |    —    |    —    |    ✓    |    ✓    |   —   |      —      |
| home     |    ○    |    ○    |    ○    |    ○    |   —   |      —      |
| explore  |    ○    |    ○    |    ○    |    ○    |   —   |      —      |
| genre    |    ○    |    ○    |    ○    |    ○    |   —   |      —      |
| voice    |    —    |    —    |    —    |    —    |   ✓   |      —      |
| tts      |    —    |    —    |    —    |    —    |   ✓   |      —      |
| language |    —    |    —    |    —    |    —    |   —   |      ✓      |
| translate|    —    |    —    |    —    |    —    |   —   |      ✓      |

✓ = required, ○ = optional, — = not used

---

## 2. Rhino Runtime Constraints (ES6 Safe Mode)

> [!CAUTION]
> Đây là nguyên nhân #1 gây lỗi. Phải tuân thủ tuyệt đối.

### ❌ CẤM sử dụng
- `async/await` — Rhino không hỗ trợ
- `?.` (optional chaining)
- `??` (nullish coalescing)
- `{...spread}` (object spread)
- `Array.flat()`, `Array.flatMap()`
- Numeric separators (`1_000_000`)
- Template literals với tag functions
- Khai báo biến trùng tên config key (`let DOMAIN = ...` → SyntaxError)

### ✅ SỬ DỤNG thay thế
```javascript
// Thay vì optional chaining
var value = obj && obj.prop && obj.prop.nested;

// Thay vì nullish coalescing
var val = x != null ? x : defaultVal;

// Thay vì spread
var merged = Object.assign({}, obj1, obj2);

// Thay vì async/await — mọi fetch đều synchronous
var doc = fetch(url).html();

// Thay vì arrow functions (dùng khi cần)
items.map(function(el) { return el.text(); });
```

### Response Format
Mọi script PHẢI return qua `Response` helper:
```javascript
return Response.success(data);           // { code: 0, data: ... }
return Response.success(data, data2);    // { code: 0, data: ..., data2: ... }
return Response.error("message");        // { code: 1, data: "message" }
```

### Fetch Safety
**LUÔN** kiểm tra `response.ok` trước khi đọc body:
```javascript
var res = fetch(url);
if (!res.ok) return Response.error("HTTP " + res.status);
var doc = res.html();
```

---

## 3. Quy trình Phát triển Extension

### 3.1 Tạo extension mới

```bash
# Từ template chuẩn
npm run ext:create -- --name "Tên Extension" --source "https://domain.com" --type novel

# Hoặc dùng CLI trực tiếp
node tools/cli/index.js ext --mode create --name "Demo" --source "https://example.com" --type novel
```

### 3.2 Viết/sửa script

1. Đọc API docs: `api_docs.md`
2. Tham khảo template: `templates/<type>/`
3. Tham khảo extensions đã có trong `them_chuc_nang/` hoặc `extensions/`
4. Viết code tuân thủ Rhino constraints
5. Test từng script

### 3.3 Test script

```bash
# Kết nối với app
npm run vbook:connect

# Test một script cụ thể
node tools/cli/index.js test <ext-folder> <script.js> [args...]

# Test toàn bộ extension
npm run vbook:testall -- <ext-folder>
```

### 3.4 Build & Deploy

```bash
# Build ZIP
npm run vbook:build -- <ext-folder>

# Cài trực tiếp vào app
npm run vbook:install -- <ext-folder>

# Cập nhật catalog (bắt buộc trước khi commit)
npm run build:catalog
```

### 3.5 Validate

```bash
# Kiểm tra Rhino compatibility
node tools/cli/index.js validate --plugin <ext-folder>

# Verify toàn bộ project
node tools/cli/index.js verify
```

---

## 4. Script Contracts (Tóm tắt)

### search.js
```javascript
function execute(query, page) {
    query = query || "";
    page = page || "1";
    var url = DOMAIN + "/search?q=" + encodeURIComponent(query) + "&page=" + page;
    var res = fetch(url);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();
    var items = doc.select(".item").map(function(el) {
        return {
            name: el.select(".title").text(),
            cover: el.select("img").attr("src"),
            link: el.select("a").attr("href"),
            description: el.select(".desc").text(),
            tag: el.select(".tag").text()
        };
    });
    var hasNext = !doc.select(".next-page").isEmpty();
    return Response.success(items, hasNext ? String(parseInt(page) + 1) : "");
}
```

### detail.js
```javascript
function execute(url) {
    var res = fetch(url);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();
    return Response.success({
        name: doc.select("h1").text(),
        author: doc.select(".author").text(),
        cover: doc.select(".cover img").attr("src"),
        description: doc.select(".description").html(),
        url: url,
        ongoing: true,
        tags: []
    });
}
```

### toc.js
```javascript
function execute(url) {
    var res = fetch(url);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();
    var chapters = doc.select(".chapter a").map(function(el) {
        return { name: el.text(), url: el.attr("href") };
    });
    return Response.success(chapters);
}
```

### chap.js (novel)
```javascript
function execute(url) {
    var res = fetch(url);
    if (!res.ok) return Response.error("HTTP " + res.status);
    var doc = res.html();
    var content = doc.select(".chapter-content").html();
    var title = doc.select(".chapter-title").text();
    return Response.success(content, title);
}
```

---

## 5. plugin.json Schema

```json
{
    "metadata": {
        "name": "Extension Name",
        "author": "author",
        "version": 1,
        "source": "https://example.com",
        "description": "Mô tả extension",
        "locale": "vi",
        "regexp": "example\\.com",
        "type": "novel",
        "nsfw": false
    },
    "script": {
        "search": "search.js",
        "detail": "detail.js",
        "toc": "toc.js",
        "chap": "chap.js"
    },
    "config": {
        "DOMAIN": {
            "title": "Domain",
            "default": "https://example.com",
            "values": ["https://example.com"],
            "mode": "select",
            "format": "single"
        }
    }
}
```

---

## 6. Checklist trước khi Commit

- [ ] Tất cả script đều return `Response.success()` hoặc `Response.error()`
- [ ] Mọi `fetch()` đều check `response.ok` trước khi đọc body
- [ ] Không dùng syntax cấm (async/await, ?., ??, spread, etc.)
- [ ] Không khai báo biến trùng tên config key
- [ ] `plugin.json` metadata đầy đủ và chính xác
- [ ] Version đã được nâng lên +1
- [ ] Đã chạy `npm run build:catalog`
- [ ] Đã chạy validate: `node tools/cli/index.js validate --plugin <ext>`
- [ ] Đã dọn dẹp log/testcase thừa
- [ ] Đã hỏi ý kiến User trước khi commit

---

## 7. Available JS APIs (Tham chiếu nhanh)

### HTTP
```javascript
var res = fetch(url, { method: "POST", headers: {...}, body: "...", queries: {...}, timeout: 30000 });
res.ok; res.status; res.text(); res.json(); res.html(); res.base64();
```

### HTML Parsing
```javascript
var doc = Html.parse(htmlString);
doc.select("css-selector"); el.text(); el.html(); el.attr("href");
```

### Storage
```javascript
localStorage.setItem("key", "value"); localStorage.getItem("key");
cacheStorage.setItem("key", "value"); cacheStorage.getItem("key");
```

### Browser (headless)
```javascript
var browser = Engine.newBrowser();
var doc = browser.launch(url, timeout);
browser.callJs("js code", timeout);
browser.close();
```

### Translation (Qt)
```javascript
var result = Qt.translate("中文", "vi");
```

### Utilities
```javascript
Log.log("msg"); sleep(1000);
var result = Script.execute("script", "func", "input");
```

---

## 8. Tài liệu Tham chiếu

- **Full API Docs**: [api_docs.md](file:///c:/extension_vbook/Meo_vbook/api_docs.md)
- **Templates**: [templates/](file:///c:/extension_vbook/Meo_vbook/templates/)
- **CLI Tools**: [tools/cli/](file:///c:/extension_vbook/Meo_vbook/tools/cli/)
- **MCP Server**: [vbook-mcp-server.js](file:///c:/extension_vbook/Meo_vbook/vbook-mcp-server.js)
- **Existing Extensions**: [them_chuc_nang/](file:///c:/extension_vbook/Meo_vbook/them_chuc_nang/)
- **Catalog**: [plugin.json](file:///c:/extension_vbook/Meo_vbook/plugin.json)

