---
name: vbook-publish
description: >-
  Build, validate, and publish vBook extensions to the catalog. Use this skill
  when preparing an extension for release, building ZIP files, updating the
  catalog, or preparing a git commit.
---

# VBook Extension Publisher — Skill

Quy trình build, validate, và publish extension vBook.

---

## Quy trình Publish

### Bước 1: Validate Extension

```bash
# Kiểm tra Rhino compatibility và patterns
node tools/cli/index.js validate --plugin <ext-folder>
```

Đảm bảo:
- Không có syntax lỗi Rhino
- Tất cả required scripts đều tồn tại
- `plugin.json` metadata hợp lệ
- `icon.png` tồn tại (200×200 px)

### Bước 2: Nâng Version

Trong `plugin.json`, tăng `metadata.version` lên 1:
```json
{
    "metadata": {
        "version": 5  // ← tăng từ 4 lên 5
    }
}
```

Hoặc dùng CLI:
```bash
node tools/cli/index.js ext --mode edit --plugin <ext-folder> --bump-version
```

### Bước 3: Build ZIP

```bash
# Build extension thành plugin.zip
npm run vbook:build -- <ext-folder>

# Hoặc
node tools/cli/index.js build --plugin <ext-folder>
```

### Bước 4: Cập nhật Catalog

```bash
# PHẢI chạy trước mỗi commit
npm run build:catalog
```

Lệnh này sẽ:
- Quét tất cả extensions trong `extensions/` và `them_chuc_nang/`
- Rebuild `plugin.json` root catalog
- Sync metadata

### Bước 5: Verify toàn bộ Project

```bash
# Full project check
node tools/cli/index.js verify
```

Kiểm tra:
- Catalog sync (plugin.json root khớp với extensions)
- ZIP integrity (plugin.zip chứa đúng files)
- Metadata consistency

### Bước 6: Commit (sau khi được User xác nhận)

> [!WARNING]
> **PHẢI hỏi ý kiến User trước khi commit.** Đây là quy tắc bắt buộc.

```bash
git add .
git commit -m "feat(ext): <mô tả thay đổi>"
git push origin main
```

---

## Checklist Publish

- [ ] Validate pass: `node tools/cli/index.js validate --plugin <ext>`
- [ ] Version đã nâng: `metadata.version += 1`
- [ ] ZIP đã build: `npm run vbook:build -- <ext>`
- [ ] Catalog đã cập nhật: `npm run build:catalog`
- [ ] Verify pass: `node tools/cli/index.js verify`
- [ ] Test trên app (nếu có kết nối): `npm run vbook:install -- <ext>`
- [ ] Đã hỏi ý kiến User xác nhận commit
- [ ] Đã dọn dẹp log/testcase thừa

