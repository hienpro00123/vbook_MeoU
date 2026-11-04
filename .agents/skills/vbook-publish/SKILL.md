---
name: vbook-publish
description: >-
  Build, validate, and publish vBook extensions to the catalog. Use this skill
  when preparing an extension for release, building ZIP files, updating the
  catalog, or preparing a git commit.
---

# VBook Extension Publisher — Skill

Quy trình build, validate, và publish extension vBook.

## Phạm vi publish lên GitHub

Repo `hienpro00123/vbook_MeoU` (GitHub) chỉ chứa **nội dung bên trong** thư mục `extensions/` local, đặt flat ở root:

- `plugin.json` (public catalog), `README.md`, `donate.jpg`
- Các thư mục `<type>/` (`audio`, `comic`, `chinese_novel`, `novel`, `translate`, `tts`, `video`)
- Bên trong mỗi `<type>/`: `plugin.json` category, `<folder>/plugin.json`, `icon.png`, `plugin.zip`, `src/`

Local giữ toàn bộ dữ liệu trong `extensions/` (kèm public catalog `extensions/plugin.json`). Không có folder `extensions/` trên GitHub.
Đây là vị trí nguồn bắt buộc cho mọi thao tác local: không tạo hoặc publish extension từ thư mục `<type>/` ở repository root. Các lệnh build, validate, test và install phải dùng `extensions/<type>/<folder>`.

**Không commit/push** `.agents/`, `tools/`, `api_docs.md`, `.cursorrules`, `CLAUDE.md`, `package.json` hay tài liệu/tooling root — đây là công cụ local.

---

## Quy trình Publish

### Bước 1: Validate Extension

```bash
# Kiểm tra Rhino compatibility và patterns
node tools/cli/index.js validate --plugin extensions/<type>/<folder>
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
node tools/cli/index.js ext --mode edit --plugin extensions/<type>/<folder> --bump-version
```

### Bước 3: Build ZIP

```bash
# Build extension thành plugin.zip
npm run vbook:build -- extensions/<type>/<folder>

# Hoặc
node tools/cli/index.js build --plugin extensions/<type>/<folder>
```

### Bước 4: Cập nhật Catalog

```bash
# PHẢI chạy trước mỗi commit
npm run build:catalog
```

Lệnh này sẽ:
- Quét các thư mục `extensions/<type>/` (`novel`, `comic`, `video`, `audio`, `chinese_novel`, `translate`, `tts`)
- Rebuild `extensions/<type>/plugin.json` (category catalog, `relativePath: "extensions/<type>/<folder>"`)
- Rebuild `extensions/plugin.json` (public catalog với URL raw GitHub flat `<type>/<folder>`)

Sau khi build catalog, kiểm tra và giữ nguyên mọi URL ZIP được ghim theo SHA commit; catalog builder mặc định có thể ghi lại URL về nhánh `main`.

### Bước 5: Verify toàn bộ Project

```bash
# Full project check
node tools/cli/index.js verify
```

Kiểm tra:
- Catalog sync (`extensions/<type>/plugin.json` + `extensions/plugin.json` khớp với các `extensions/<type>/<folder>`)
- ZIP integrity (plugin.zip chứa đúng files)
- Metadata consistency

### Bước 6: Publish lên GitHub (sau khi được User xác nhận)

> [!WARNING]
> **PHẢI hỏi ý kiến User trước khi publish/commit/push.** Đây là quy tắc bắt buộc.

GitHub nhận **nội dung bên trong** `extensions/` tại root (flat, không có folder `extensions/`). Lệnh publish tự động: verify → clone/mirror `.publish/` → sync nội dung `extensions/` ra root → commit → push origin main.

```bash
node tools/cli/index.js publish -m "feat(ext): <mô tả thay đổi>"
```

Không commit/push trực tiếp từ repo local (layout local khác layout GitHub).

---

## Checklist Publish

- [ ] Validate pass: `node tools/cli/index.js validate --plugin extensions/<type>/<folder>`
- [ ] Version đã nâng: `metadata.version += 1`
- [ ] ZIP đã build: `npm run vbook:build -- extensions/<type>/<folder>`
- [ ] Catalog đã cập nhật: `npm run build:catalog`
- [ ] Verify pass: `node tools/cli/index.js verify`
- [ ] Đã hỏi ý kiến User xác nhận publish
- [ ] Publish: `node tools/cli/index.js publish -m "<message>"`
- [ ] Test trên app (nếu có kết nối): `npm run vbook:install -- extensions/<type>/<folder>`
- [ ] Đã hỏi ý kiến User xác nhận commit
- [ ] Đã dọn dẹp log/testcase thừa
