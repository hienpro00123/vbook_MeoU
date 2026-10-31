const fs = require('fs');
const path = require('path');
const { checkExtensionZipIntegrity } = require('../build/build');

function handleVerifyCommand(options, workspaceRoot) {
    const extRoot = path.join(workspaceRoot, 'extensions');
    const catalogPluginPath = path.join(extRoot, 'plugin.json');
    const rootPluginPath = path.join(workspaceRoot, 'plugin.json');
    const types = ['novel', 'comic', 'video', 'audio', 'chinese_novel', 'translate', 'tts'];
    
    console.log('\nVBook Project Verification');
    console.log('========================');

    let overallSuccess = true;

    // 1. Check catalogs
    const hasCatalogPlugin = fs.existsSync(catalogPluginPath);
    const hasRootPlugin = fs.existsSync(rootPluginPath);

    if (!hasCatalogPlugin) {
        console.warn('[WARNING] extensions/plugin.json is missing.');
    }
    if (!hasRootPlugin) {
        console.warn('[WARNING] root plugin.json is missing. This is your public catalog.');
    }

    const catalogPlugin = hasCatalogPlugin ? JSON.parse(fs.readFileSync(catalogPluginPath, 'utf8')) : {};
    const rootPlugin = hasRootPlugin ? JSON.parse(fs.readFileSync(rootPluginPath, 'utf8')) : {};
    const rootData = Array.isArray(rootPlugin.data) ? rootPlugin.data : [];

    // 2. Scan extensions
    console.log('\n--- Checking Extensions Alignment ---');
    let totalExts = 0;
    let syncedExts = 0;

    for (const type of types) {
        const typeDir = path.join(extRoot, type);
        if (!fs.existsSync(typeDir)) continue;

        const folders = fs.readdirSync(typeDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        folders.forEach(folder => {
            totalExts++;
            const relPath = `extensions/${type}/${folder}`;
            const inCatalog = catalogPlugin[type] && catalogPlugin[type].some(e => e.relativePath === relPath);
            const inRoot = rootData.some(e => e.path && e.path.includes(relPath));
            
            const integrity = checkExtensionZipIntegrity(workspaceRoot, relPath);
            
            let issues = [];
            if (!inCatalog) issues.push('NOT_IN_CATALOG');
            if (!inRoot) issues.push('NOT_IN_ROOT');
            if (!integrity.exists) issues.push('MISSING_ZIP');
            else if (!integrity.upToDate) issues.push('OUTDATED_ZIP');

            if (issues.length > 0) {
                console.log(`✗ ${relPath} -> [${issues.join(', ')}]`);
                overallSuccess = false;
            } else {
                syncedExts++;
                console.log(`✓ ${relPath}`);
            }
        });
    }

    console.log(`\nStatistics: ${syncedExts}/${totalExts} extensions are fully synchronized and up-to-date.`);

    if (overallSuccess) {
        console.log('\n[SUCCESS] All public extensions are built, zipped, and cataloged.');
    } else {
        console.warn('\n[ISSUE] Action required: Rebuild catalogs or outdated ZIPs.');
    }

    return overallSuccess;
}

module.exports = { handleVerifyCommand };
