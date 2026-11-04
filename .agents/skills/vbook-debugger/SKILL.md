---
name: vbook-debugger
description: >-
  Debug and fix broken vBook extensions. Use this skill when an extension script
  fails, returns errors, or produces incorrect data. Handles common Rhino runtime
  errors, fetch failures, selector mismatches, and encoding issues.
---

# VBook Extension Debugger — Skill

Hướng dẫn debug và sửa lỗi extension vBook.

---

## Quy trình Debug

### 1. Xác định lỗi

```bash
# Test script để xem lỗi
node tools/cli/index.js test extensions/<type>/<folder> <script.js> [args...]
```

### 2. Phân loại lỗi thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `SyntaxError` | Dùng syntax Rhino không hỗ trợ | Xem Rhino constraints trong vbook-extensions skill |
| `TypeError: Cannot read property` | Null/undefined access | Thêm null guards |
| `Response.error("HTTP 403")` | Anti-bot / Cloudflare | Thêm headers, User-Agent |
| `Response.error("HTTP 404")` | URL sai / domain thay đổi | Cập nhật domain trong config |
| Empty results | Selectors sai / site thay đổi | Re-analyze selectors |
| Encoding lỗi | Charset không đúng | Dùng `.text("gbk")` hoặc `.html("gbk")` |
| `SyntaxError: redeclaration` | Khai báo biến trùng config key | Đổi tên biến hoặc dùng `load('config.js')` |

### 3. Debug Patterns

#### Null Safety
```javascript
// ❌ Sai
var title = doc.select("h1").text();

// ✅ Đúng
var titleEl = doc.select("h1");
var title = titleEl.isEmpty() ? "" : titleEl.text();
```

#### Response Check
```javascript
// ❌ Sai
var doc = fetch(url).html();

// ✅ Đúng
var res = fetch(url);
if (!res.ok) return Response.error("HTTP " + res.status + " " + res.statusText);
var doc = res.html();
```

#### JSON Parse Safety
```javascript
var res = fetch(apiUrl);
if (!res.ok) return Response.error("HTTP " + res.status);
var text = res.text();
var json;
try {
    json = JSON.parse(text);
} catch(e) {
    return Response.error("JSON parse error: " + e.message);
}
```

#### Domain/URL Issues
```javascript
// Kiểm tra URL tuyệt đối vs tương đối
var link = el.attr("href");
if (link && link.indexOf("http") !== 0) {
    link = DOMAIN + (link.indexOf("/") === 0 ? "" : "/") + link;
}
```

### 4. Validate sau khi sửa

```bash
# Kiểm tra Rhino compatibility
node tools/cli/index.js validate --plugin extensions/<type>/<folder>

# Test lại script
node tools/cli/index.js test extensions/<type>/<folder> <script.js> [args...]
```

---

## Checklist Debug

- [ ] Đã xác định đúng script bị lỗi
- [ ] Đã kiểm tra fetch response.ok
- [ ] Đã kiểm tra null/undefined guards
- [ ] Đã kiểm tra CSS selectors còn đúng không
- [ ] Đã kiểm tra domain/URL có thay đổi không
- [ ] Đã validate Rhino compatibility
- [ ] Đã test lại thành công
- [ ] Đã dọn log debug
