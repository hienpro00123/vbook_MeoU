const { buildCatalog } = require('../build/build-catalog');

function handleCatalogCommand(options, workspaceRoot) {
    const result = buildCatalog(workspaceRoot);
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('');
        console.log('VBook Catalog Build');
        console.log('===================');
        result.files.forEach(f => {
            console.log(`  ${f.path}: ${f.count} entries`);
        });
        console.log(`\nTotal: ${result.total} extensions`);
        console.log(result.message);
    }
    return result.success;
}

module.exports = { handleCatalogCommand };
