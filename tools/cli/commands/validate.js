const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

async function handleValidateCommand(options, workspaceRoot) {
    const pluginPath = options.plugin || 'extensions/novel/kychi_ntruyen';
    const resolvedPath = path.resolve(workspaceRoot, pluginPath);
    const srcDir = path.join(resolvedPath, 'src');
    const pJsonPath = path.join(resolvedPath, 'plugin.json');

    if (!fs.existsSync(srcDir)) {
        console.error(`[ERROR] src/ directory not found in ${pluginPath}`);
        return false;
    }

    let registeredScripts = new Set();
    if (fs.existsSync(pJsonPath)) {
        try {
            const p = JSON.parse(fs.readFileSync(pJsonPath, 'utf8'));
            if (p.script) {
                Object.values(p.script).forEach(s => registeredScripts.add(s));
            }
        } catch (e) {}
    }

    console.log(`\nVBook Extension Validation: ${pluginPath}`);
    console.log('=========================================');

    let overallSuccess = true;
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const filePath = path.join(srcDir, file);
        const code = fs.readFileSync(filePath, 'utf8');
        console.log(`\nChecking ${file}...`);

        // 1. AST Validation for Rhino ES6 Safe Mode
        try {
            acorn.parse(code, { ecmaVersion: 2020 });
            console.log(`  ✓ Syntax: Valid JavaScript syntax.`);
        } catch (err) {
            console.warn(`  ✗ Syntax Error at ${err.loc.line}:${err.loc.column}: ${err.message}`);
            overallSuccess = false;
        }

        // 2. VBook API Pattern & Constraint Checks
        // Chỉ bắt buộc execute() cho các file đăng ký trong plugin.json.script (trừ config.js)
        const isRegisteredEntry = registeredScripts.size > 0 ? registeredScripts.has(file) : (file !== 'config.js');
        if (isRegisteredEntry && file !== 'config.js') {
            if (!code.includes('function execute')) {
                console.warn(`  ✗ Missing 'function execute(...)' entry point.`);
                overallSuccess = false;
            } else {
                console.log(`  ✓ Found 'execute' function.`);
            }

            // Check response.ok
            if ((code.includes('.html()') || code.includes('.json()') || code.includes('.text()')) && !code.includes('.ok')) {
                console.warn(`  ! Warning: Calling .html()/.json()/.text() without checking 'response.ok'.`);
            }
        } else {
            console.log(`  ℹ Helper/Library file (no execute function required).`);
        }

        // Check for forbidden re-declaration of DOMAIN or config keys
        if (/(?:let|const|var)\s+DOMAIN\s*=/i.test(code)) {
            console.warn(`  ✗ Forbidden: Declaring 'DOMAIN' variable. DOMAIN is injected by Host App. Use load('config.js') and BASE_URL.`);
            overallSuccess = false;
        }

        // Check for async/await or unsupported features
        if (/\b(async|await)\b/.test(code)) {
            console.warn(`  ✗ Unsupported on Rhino: 'async/await' keyword detected.`);
            overallSuccess = false;
        }
        if (/\?\.\s*[^0-9]/.test(code)) {
            console.warn(`  ✗ Unsupported on Rhino: Optional chaining '?.' detected.`);
            overallSuccess = false;
        }
        if (/\?\?/.test(code)) {
            console.warn(`  ✗ Unsupported on Rhino: Nullish coalescing '??' detected.`);
            overallSuccess = false;
        }
    }

    if (overallSuccess) {
        console.log('\n[SUCCESS] Extension is valid and compliant with VBook Rhino ES6 Safe Mode.');
    } else {
        console.warn('\n[ISSUE] Validation failed. Please fix the items above.');
    }

    return overallSuccess;
}

module.exports = { handleValidateCommand };
