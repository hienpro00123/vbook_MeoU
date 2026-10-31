const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

async function validateSingle(pluginPath, workspaceRoot) {
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
        if (file.endsWith('.encrypted.js')) {
            console.log(`\nChecking ${file}...`);
            console.log(`  ℹ Encrypted bytecode/file (skipped AST check).`);
            continue;
        }

        const filePath = path.join(srcDir, file);
        const code = fs.readFileSync(filePath, 'utf8');
        console.log(`\nChecking ${file}...`);

        // 1. AST Validation for Rhino ES6 Safe Mode
        let ast = null;
        try {
            ast = acorn.parse(code, { ecmaVersion: 2020 });
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

        // AST walk for unsupported Rhino features
        if (ast) {
            function walkAst(node) {
                if (!node || typeof node !== 'object') return;
                if (node.type === 'ChainExpression') {
                    console.warn(`  ✗ Unsupported on Rhino: Optional chaining '?.' detected.`);
                    overallSuccess = false;
                }
                if (node.type === 'LogicalExpression' && node.operator === '??') {
                    console.warn(`  ✗ Unsupported on Rhino: Nullish coalescing '??' detected.`);
                    overallSuccess = false;
                }
                if (node.async || node.type === 'AwaitExpression') {
                    console.warn(`  ✗ Unsupported on Rhino: 'async/await' detected.`);
                    overallSuccess = false;
                }
                for (const key of Object.keys(node)) {
                    if (key === 'loc' || key === 'range') continue;
                    const child = node[key];
                    if (Array.isArray(child)) {
                        child.forEach(walkAst);
                    } else if (child && typeof child === 'object') {
                        walkAst(child);
                    }
                }
            }
            walkAst(ast);
        }
    }

    if (overallSuccess) {
        console.log(`\n[SUCCESS] ${pluginPath} is valid and compliant with VBook Rhino ES6 Safe Mode.`);
    } else {
        console.warn(`\n[ISSUE] Validation failed for ${pluginPath}.`);
    }

    return overallSuccess;
}

async function handleValidateCommand(options, workspaceRoot) {
    if (options && options.plugin) {
        return validateSingle(options.plugin, workspaceRoot);
    }

    // Default: validate all extensions in extensions/
    const baseDir = path.resolve(workspaceRoot, 'extensions');
    const categories = ['novel', 'comic', 'video', 'chinese_novel', 'translate', 'tts'];
    let allPassed = true;
    let validatedCount = 0;

    for (const cat of categories) {
        const catDir = path.join(baseDir, cat);
        if (!fs.existsSync(catDir)) continue;
        const items = fs.readdirSync(catDir).filter(f => fs.statSync(path.join(catDir, f)).isDirectory());
        for (const item of items) {
            const relPath = `extensions/${cat}/${item}`;
            if (fs.existsSync(path.join(workspaceRoot, relPath, 'plugin.json'))) {
                const passed = await validateSingle(relPath, workspaceRoot);
                validatedCount++;
                if (!passed) allPassed = false;
            }
        }
    }

    console.log(`\n=========================================`);
    console.log(`Validated ${validatedCount} extensions. Result: ${allPassed ? 'ALL PASSED ✓' : 'SOME FAILED ✗'}`);
    return allPassed;
}

module.exports = { handleValidateCommand };
