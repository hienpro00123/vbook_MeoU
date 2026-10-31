const { buildExtensionZip, checkExtensionZipIntegrity } = require('../build/build');

async function handleBuildCommand(options, workspaceRoot) {
    if (options.verify) {
        const check = checkExtensionZipIntegrity(workspaceRoot, options.plugin);
        if (options.json) {
            console.log(JSON.stringify(check, null, 2));
        } else {
            console.log('');
            console.log('VBook Extension ZIP Verification');
            console.log('===============================');
            console.log(`Plugin: ${options.plugin}`);
            console.log(`Exists: ${check.exists ? 'Yes' : 'No'}`);
            console.log(`Up-to-date: ${check.upToDate ? 'Yes' : 'No'}`);
            if (check.exists && !check.upToDate) {
                console.warn('\n[WARNING] plugin.zip is OUTDATED. Please rebuild before committing.');
            }
        }
        return check.upToDate;
    }

    const result = await buildExtensionZip(workspaceRoot, options.plugin, options.dryRun);
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('');
        console.log('VBook Extension Build');
        console.log('====================');
        console.log(`Extension: ${result.extDir}`);
        console.log(`Zip: ${result.zipPath}`);
        console.log(`Name: ${result.name} (v${result.version})`);
        if (result.built) {
            console.log(`Built: yes (${result.size} bytes)`);
        } else {
            console.log(`Built: no (dry-run)`);
        }
    }
    return result.success;
}

module.exports = { handleBuildCommand };
