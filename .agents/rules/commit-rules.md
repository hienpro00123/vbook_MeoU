# Commit Rules — VBook Extensions

## Before ANY commit:

1. **Version bump**: Increment `metadata.version` in `plugin.json` by 1
2. **Build catalog**: Run `npm run build:catalog`
3. **Validate**: Run `node tools/cli/index.js validate --plugin <ext>`
4. **Verify**: Run `node tools/cli/index.js verify`
5. **Clean up**: Remove all debug logs and test artifacts
6. **Ask user**: ALWAYS ask for user confirmation before committing

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

