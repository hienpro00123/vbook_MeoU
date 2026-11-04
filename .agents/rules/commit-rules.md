# Commit Rules — VBook Extensions

## Repository scope

Repo GitHub chỉ chứa **nội dung bên trong** thư mục `extensions/` local, đặt flat ở root:

- `plugin.json` (public catalog), `README.md`, `donate.jpg`
- `<type>/` (`audio`, `comic`, `chinese_novel`, `novel`, `translate`, `tts`, `video`)

Local giữ toàn bộ dữ liệu trong `extensions/` (kèm public catalog `extensions/plugin.json`). Không có folder `extensions/` trên GitHub.
Mọi extension local phải nằm trong `extensions/<type>/<folder>/`; không lưu mã nguồn, manifest, icon hay ZIP của extension trực tiếp trong các thư mục loại ở repository root.

**Không commit/push** `.agents/`, `tools/`, `api_docs.md`, `.cursorrules`, `CLAUDE.md`, `package.json`, `.publish/` hoặc tài liệu/tooling root.

## Before ANY publish:

1. **Version bump**: Increment `metadata.version` in `extensions/<type>/<folder>/plugin.json` by 1
2. **Build catalog**: Run `npm run build:catalog`
3. **Validate**: Run `node tools/cli/index.js validate --plugin extensions/<type>/<folder>`
4. **Verify**: Run `node tools/cli/index.js verify`
5. **Clean up**: Remove all debug logs and test artifacts
6. **Ask user**: ALWAYS ask for user confirmation before committing
7. **Publish**: Run `node tools/cli/index.js publish -m "<message>"` — sync nội dung `extensions/` ra root GitHub (flat), commit và push origin main. Không push trực tiếp từ repo local.

## Commit message format:
```
feat(ext): <description>     — new extension or feature
fix(ext): <description>      — bug fix
chore(ext): <description>    — maintenance, version bump
docs: <description>          — documentation only
refactor(ext): <description> — code refactor without behavior change
```

## NEVER commit:
- Debug `Log.log()` or `console.log()` statements left in production code
- Unused test files or test data
- `node_modules/` or `.env` files
- Unbuilt extensions (missing `plugin.zip`)
