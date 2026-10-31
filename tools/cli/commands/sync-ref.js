const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function handleSyncRefCommand(options, workspaceRoot) {
    const reposDir = path.join(workspaceRoot, '.private', 'references', 'repos');
    const codeRefDir = path.join(workspaceRoot, '.private', 'code-reference');
    const remoteSourcesPath = path.join(workspaceRoot, 'vbook-web-service', 'web', 'remote-sources.json');

    if (!fs.existsSync(reposDir)) fs.mkdirSync(reposDir, { recursive: true });
    if (!fs.existsSync(codeRefDir)) fs.mkdirSync(codeRefDir, { recursive: true });

    console.log('\nVBook Reference Sync & Merge');
    console.log('===========================');

    // 1. Load remote sources
    if (!fs.existsSync(remoteSourcesPath)) {
        console.error(`[ERROR] ${remoteSourcesPath} not found.`);
        return false;
    }

    const remoteSources = JSON.parse(fs.readFileSync(remoteSourcesPath, 'utf8'));
    const sources = remoteSources.sources || [];

    console.log(`Found ${sources.length} sources in manifest.`);

    // 2. Sync Repos (Git Pull/Clone)
    console.log('\n--- Syncing Repositories ---');
    for (const source of sources) {
        const repoInfo = parseRepoInfo(source.url);
        if (!repoInfo) {
            console.log(`[SKIP] Could not parse repo info for: ${source.id}`);
            continue;
        }

        const targetRepoDir = path.join(reposDir, repoInfo.repo);
        console.log(`\nChecking ${repoInfo.owner}/${repoInfo.repo}...`);

        if (fs.existsSync(targetRepoDir)) {
            // Check if it is a git repo
            if (fs.existsSync(path.join(targetRepoDir, '.git'))) {
                console.log(`  Updating existing repo...`);
                try {
                    execSync('git pull', { cwd: targetRepoDir, stdio: 'ignore' });
                    console.log(`  [SUCCESS] Pulled latest changes.`);
                } catch (err) {
                    console.warn(`  [WARN] Failed to pull (repo might be deleted or private). Keeping local copy.`);
                }
            } else {
                console.log(`  Local copy exists but is not a git repo. Skipping sync.`);
            }
        } else {
            console.log(`  Cloning new repo: ${repoInfo.url}...`);
            try {
                execSync(`git clone ${repoInfo.url} "${repoInfo.repo}"`, { cwd: reposDir, stdio: 'ignore' });
                console.log(`  [SUCCESS] Cloned.`);
            } catch (err) {
                console.warn(`  [ERROR] Failed to clone ${repoInfo.url}. Repo may be deleted.`);
            }
        }
    }

    // 3. Merge Extensions into code-reference
    console.log('\n--- Merging Extensions into code-reference ---');
    const repoFolders = fs.readdirSync(reposDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name !== '_remote_raw')
        .map(d => d.name);

    let mergeCount = 0;

    for (const repoName of repoFolders) {
        const repoPath = path.join(reposDir, repoName);
        console.log(`Scanning repo: ${repoName}...`);
        
        // Find extension folders (folders containing plugin.json)
        const items = fs.readdirSync(repoPath, { withFileTypes: true });
        for (const item of items) {
            if (!item.isDirectory()) continue;
            
            const extPath = path.join(repoPath, item.name);
            const pluginJsonPath = path.join(extPath, 'plugin.json');
            
            if (fs.existsSync(pluginJsonPath)) {
                try {
                    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
                    const type = (plugin.metadata && plugin.metadata.type) || 'novel';
                    const targetDir = path.join(codeRefDir, type, item.name);
                    
                    if (!fs.existsSync(path.dirname(targetDir))) {
                        fs.mkdirSync(path.dirname(targetDir), { recursive: true });
                    }
                    
                    // Simple recursive copy
                    copyDirRecursive(extPath, targetDir);
                    mergeCount++;
                    process.stdout.write('.');
                } catch (err) {
                    console.warn(`\n  [ERROR] Failed to merge ${item.name}: ${err.message}`);
                }
            }
        }
        console.log(' Done.');
    }

    console.log(`\n\n[SUCCESS] Merged ${mergeCount} extensions into .private/code-reference.`);
    return true;
}

function parseRepoInfo(url) {
    // Handle GitHub raw links
    // https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/plugin.json
    const githubRawRegex = /https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\//;
    const match = url.match(githubRawRegex);
    
    if (match) {
        const owner = match[1];
        const repo = match[2];
        return {
            owner,
            repo,
            url: `https://github.com/${owner}/${repo}.git`
        };
    }
    
    return null;
}

function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        if (entry.name === '.git') continue;
        
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

module.exports = { handleSyncRefCommand };
