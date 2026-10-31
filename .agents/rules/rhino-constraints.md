# Rhino ES6 Safe Mode — Mandatory Rules

This rule applies to ALL JavaScript files in `src/` directories of extensions.

## NEVER use these constructs:
- `async` / `await` keywords
- `?.` optional chaining operator
- `??` nullish coalescing operator
- `...` spread syntax in objects or arrays
- `Array.prototype.flat()` or `Array.prototype.flatMap()`
- Numeric separators like `1_000_000`
- `for...of` with custom iterators
- `Symbol`, `Proxy`, `Reflect`
- `WeakRef`, `FinalizationRegistry`

## ALWAYS use:
- `var` or `let` (no `const` for config keys — they're auto-injected)
- `function` keyword for function declarations
- `Object.assign()` instead of spread
- Manual null checks instead of `?.` and `??`
- `Array.prototype.forEach/map/filter` (these work in Rhino)

## Config Key Collision
Keys defined in `plugin.json.config` are injected as `const` at script load time.
NEVER redeclare them:
```javascript
// plugin.json has config key "DOMAIN"
// ❌ This causes SyntaxError:
let DOMAIN = "https://example.com";
// ✅ Use the injected constant directly:
var url = DOMAIN + "/api/search";
```

