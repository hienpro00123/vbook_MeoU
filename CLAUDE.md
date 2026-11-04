# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Xưng hô: Dùng "tôi" khi trao đổi và trả lời.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 🛠️ 5. VBook Project-Specific Cheat Sheet & Rules

This section merges VBook's codebase architecture and developer workflow instructions.

### 📋 Core User Rules (Quy tắc cốt lõi của dự án)
1. **Luôn luôn đọc tài liệu** và quy tắc trước khi viết hoặc sửa bất kỳ dòng code nào.
2. **Luôn luôn dọn dẹp log** và xóa bỏ các testcase thừa sau khi thực hiện chạy thử nghiệm.
3. **Luôn luôn hỏi ý kiến xác nhận** của User trước khi commit hoặc push code lên GitHub.
4. **Luôn luôn nâng version** trong `plugin.json` lên thêm 1 phiên bản trước khi chuẩn bị commit.

### 💻 Official Admin CLI Commands (Official REST-API CLI)
* **Kết nối server app**: `node .agents/skills/vbook-extensions/scripts/vbook.js connect` (hoặc `npm run vbook:connect`)
* **Chạy test script**: `node .agents/skills/vbook-extensions/scripts/vbook.js test extensions/<type>/<folder> <script.js> [args...]`
* **Kiểm thử toàn bộ / Audit repo**: `node .agents/skills/vbook-extensions/scripts/vbook.js testall [ext...] [--query <kw>] [--json report.json]` (hoặc `npm run vbook:testall`)
* **Cài đặt trực tiếp vào app**: `node .agents/skills/vbook-extensions/scripts/vbook.js install extensions/<type>/<folder>`
* **Đóng gói ZIP**: `node .agents/skills/vbook-extensions/scripts/vbook.js build extensions/<type>/<folder> [out.zip]`

### 💻 Local Tooling CLI Commands
* **Khởi tạo extension**: `npm run ext:create -- --name <Tên_Extension> --source <URL_Nguồn> --type <type> --folder <folder>` (CLI mặc định lưu tại `extensions/<type>/<folder>`)
* **Cập nhật catalog tổng**: `npm run build:catalog` (Bắt buộc chạy trước khi commit nếu có đổi extension)

### 🗂️ Repository Layout (local `extensions/`, GitHub flat)
Local: toàn bộ dữ liệu publish nằm trong `extensions/` (kèm public catalog `extensions/plugin.json`, `README.md`, `donate.jpg`).
Mỗi extension là `extensions/<type>/<folder>/` chứa `plugin.json`, `icon.png`, `plugin.zip`, `src/`.
Không tạo extension mới hoặc lưu mã nguồn extension trực tiếp trong các thư mục `<type>/` ở root; mọi lệnh test/build/validate/install phải dùng đường dẫn `extensions/<type>/<folder>`.
* `extensions/plugin.json` = public catalog (`{ metadata, data }`); `extensions/<type>/plugin.json` = category catalog (array, `relativePath: "extensions/<type>/<folder>"`).
* URL `path`/`icon` trong catalog dùng raw GitHub **flat**: `https://raw.githubusercontent.com/hienpro00123/vbook_MeoU/main/<type>/<folder>/...`.
* GitHub root = nội dung bên trong `extensions/` (flat, không có folder `extensions/`). Không push `.agents/`, `tools/`, `.publish/`, tài liệu/tooling root.
* Publish: `node tools/cli/index.js publish -m "<message>"` (verify → sync `extensions/` ra root mirror `.publish/` → commit → push). Không push trực tiếp từ repo local.

### ⚠️ JS Runtime Constraints (Rhino ES6 Safe Mode)
Script extension chạy trên Rhino (ES6 safe subset).
* **Tránh**: `async/await`, `?.`, `??`, `{...spread}`, `Array.flat`, numeric separators.
* **Cấm**: Khai báo biến trùng tên với key trong `plugin.json.config` (ví dụ `let DOMAIN = ...` gây SyntaxError). Dùng `load('config.js')` và `BASE_URL`.
* **Quy tắc quan trọng**: Luôn kiểm tra `response.ok` trước khi gọi `.html()`, `.json()`, `.text()`.

### 📚 Key Documentation Paths
* **Extension API**: [api_docs.md](./api_docs.md)
* **Skill Master Spec**: [.agents/skills/vbook-extensions/SKILL.md](.agents/skills/vbook-extensions/SKILL.md)
* **Rhino Constraints**: [.agents/rules/rhino-constraints.md](.agents/rules/rhino-constraints.md)
* **Extension Patterns**: [.agents/rules/extension-patterns.md](.agents/rules/extension-patterns.md)
* **Commit Rules**: [.agents/rules/commit-rules.md](.agents/rules/commit-rules.md)
