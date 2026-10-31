const { scaffoldExtension, updateExistingExtension, askIfMissing } = require('../scaffold/scaffold');

async function handleExtCommand(options, workspaceRoot) {
    const mode = String(options.mode || 'create').trim().toLowerCase();
    if (mode !== 'create' && mode !== 'edit') {
        throw new Error('--mode must be create or edit.');
    }

    let result;
    if (mode === 'create') {
        const interactiveConfig = { ...options };
        if (!interactiveConfig.template && interactiveConfig.fromReference) {
            interactiveConfig.template = interactiveConfig.fromReference;
        }
        if (!interactiveConfig.author) {
            interactiveConfig.author = process.env.VBOOK_AUTHOR || 'kychi';
        }
        await askIfMissing(interactiveConfig, 'name', 'Extension name');
        await askIfMissing(interactiveConfig, 'source', 'Source URL (domain)');
        await askIfMissing(interactiveConfig, 'author', 'Author', 'kychi');
        result = scaffoldExtension(workspaceRoot, interactiveConfig);
    } else {
        result = updateExistingExtension(workspaceRoot, options);
    }

    if (options.json) {
        console.log(JSON.stringify({
            mode,
            fromReference: options.fromReference,
            ...result
        }, null, 2));
    } else {
        console.log('');
        console.log('VBook Extension Tool');
        console.log('====================');
        console.log(`Mode: ${mode}`);
        console.log(`Reference: ${options.fromReference}`);
        if (mode === 'create') {
            console.log(`Name: ${result.name}`);
            console.log(`Output: ${result.outputDir}`);
            console.log(`Generated: ${result.generated ? 'yes' : 'no (dry-run)'}`);
        } else {
            console.log(`Plugin: ${result.pluginPath}`);
            console.log(`Updated: ${result.updated ? 'yes' : 'no'}`);
            if (Array.isArray(result.changedFields) && result.changedFields.length > 0) {
                console.log(`Fields: ${result.changedFields.join(', ')}`);
            }
            if (result.message) {
                console.log(result.message);
            }
        }
    }

    return result.success;
}

module.exports = { handleExtCommand };
