---
name: vbook-analyzer
description: >-
  Analyze a target website to extract CSS selectors, page structure, and API patterns
  for building a vBook extension. Use this skill when the user wants to create a new
  extension from a website URL, or when reverse-engineering a site's structure.
---

# VBook Website Analyzer — Skill

Phân tích website nguồn để tạo extension vBook tự động.

---

## Quy trình Phân tích

### Bước 1: Thu thập thông tin
1. Fetch trang chủ, trang tìm kiếm, trang chi tiết, trang đọc truyện
2. Phân tích cấu trúc HTML/DOM
3. Xác định API endpoints (nếu có)
4. Kiểm tra JavaScript rendering requirements

### Bước 2: Xác định Selectors
Với mỗi script cần viết, xác định CSS selectors cho:

| Script   | Cần tìm                                           |
|----------|----------------------------------------------------|
| search   | Form search, container items, name/cover/link/desc |
| detail   | Title, author, cover, description, tags, status    |
| toc      | Chapter list container, chapter name/url           |
| chap     | Content container, chapter title                   |
| home     | Tab sections, item containers                      |
| explore  | Section layouts, item structure                    |

### Bước 3: Kiểm tra Patterns

**API-based sites:**
```javascript
// Nếu site dùng REST API
var json = fetch(apiUrl, { headers: {...} }).json();
```

**HTML-based sites:**
```javascript
// Nếu site dùng server-side rendering
var doc = fetch(url).html();
var items = doc.select("selector").map(function(el) { ... });
```

**JS-rendered sites:**
```javascript
// Nếu site cần JavaScript rendering
var browser = Engine.newBrowser();
var doc = browser.launch(url, 10000);
// parse doc...
browser.close();
```

### Bước 4: Sử dụng CLI Analyzer
```bash
# Phân tích tự động
node tools/cli/index.js analyze <url> --json
```

---

## Output

Sau khi phân tích, tạo:
1. Báo cáo cấu trúc site (selectors, API patterns)
2. Skeleton code cho từng script
3. `plugin.json` với metadata phù hợp
4. `test.json` với test data mẫu

---

## Lưu ý
- Luôn kiểm tra encoding (UTF-8, GBK cho site Trung Quốc)
- Kiểm tra anti-bot protection (Cloudflare, CAPTCHA)
- Kiểm tra cần headers đặc biệt (Referer, User-Agent)
- Một số site cần cookie/auth → dùng `localCookie`, `localStorage`

