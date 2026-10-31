const { handleVerifyCommand } = require('./verify');

async function handlePublishCommand(options, workspaceRoot) {
    console.log('\nVBook Extension Publish Prep');
    console.log('===========================');

    // 1. Run full verification first
    console.log('Running project verification...');
    const verified = await handleVerifyCommand(options, workspaceRoot);

    if (!verified) {
        console.error('\n[ERROR] Project verification failed. Fix all issues before publishing.');
        return false;
    }

    console.log('\n[CHECK] ZIP integrity: PASSED');
    console.log('[CHECK] Catalog alignment: PASSED');
    
    console.log('\nNext steps for publication:');
    console.log('1. Commit all changes: git commit -am "chore: release extensions"');
    console.log('2. Push to GitHub: git push origin main');
    console.log('3. Vercel will automatically redeploy the dynamic catalog.');

    return true;
}

module.exports = { handlePublishCommand };
