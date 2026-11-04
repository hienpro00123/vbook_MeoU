# VBook Extension Development — Agent Rules

## Core Rules (Quy tắc Cốt lõi)

1. **Luôn đọc tài liệu** và quy tắc trước khi viết hoặc sửa bất kỳ dòng code nào.
2. **Luôn dọn dẹp log** và xóa bỏ các testcase thừa sau khi thực hiện chạy thử nghiệm.
3. **Luôn hỏi ý kiến xác nhận** của User trước khi commit hoặc push code lên GitHub.
4. **Luôn nâng version** trong `extensions/<type>/<folder>/plugin.json` lên thêm 1 phiên bản trước khi chuẩn bị commit.
5. **Xưng hô**: Sử dụng "tôi" khi trao đổi và trả lời.
6. **Luôn lưu extension trong `extensions/`**: mọi file extension phải nằm tại `extensions/<type>/<folder>/`; không tạo extension trong thư mục loại trực tiếp ở repository root.

## Rhino Runtime — Absolute Constraints

Scripts chạy trên Rhino ES6 safe subset. Tuyệt đối KHÔNG dùng:
- `async/await`
- `?.` (optional chaining)
- `??` (nullish coalescing)
- `{...spread}` (object spread)
- `Array.flat()`, `Array.flatMap()`
- Numeric separators (`1_000_000`)
- Khai báo biến trùng tên với key trong `plugin.json.config`

## Coding Patterns

- Mọi script PHẢI return qua `Response.success(data)` hoặc `Response.error(msg)`.
- Mọi `fetch()` PHẢI kiểm tra `response.ok` trước khi gọi `.html()`, `.json()`, `.text()`.
- Dùng `function` keyword thay vì arrow functions khi cần compatibility tối đa.
- Config keys tự động inject thành `const` — KHÔNG khai báo lại.

## Code Style

- Match existing code style trong project.
- Không "cải tiến" code xung quanh khi chưa được yêu cầu.
- Không refactor thứ chưa bị broken.
- Mỗi dòng code thay đổi phải trace trực tiếp đến yêu cầu của user.

## CLI Reference

```
npm run ext:create     -- Tạo extension mới
npm run vbook:connect  -- Kết nối app
npm run vbook:test     -- Test script
npm run vbook:build    -- Build ZIP
npm run vbook:install  -- Cài vào app
npm run build:catalog  -- Rebuild catalog
```

Mọi đường dẫn test, validate, build và install phải bắt đầu bằng `extensions/`, ví dụ `extensions/novel/<folder>`. Catalog local nằm tại `extensions/plugin.json` và `extensions/<type>/plugin.json`.
