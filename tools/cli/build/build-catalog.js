const fs = require('fs');
const path = require('path');

function buildCatalog(workspaceRoot) {
    const extRoot = path.join(workspaceRoot, 'extensions');
    const types = ['novel', 'comic', 'video', 'audio', 'chinese_novel', 'translate', 'tts'];
    
    function safeReadJson(filePath) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
            return null;
        }
    }
    
    function buildEntry(type, folder) {
        const pluginPath = path.join(extRoot, type, folder, 'plugin.json');
        const plugin = safeReadJson(pluginPath);
        if (!plugin || typeof plugin !== 'object') return null;
        const metadata = plugin.metadata && typeof plugin.metadata === 'object' ? plugin.metadata : {};
        return {
            folder,
            name: metadata.name || folder,
            author: metadata.author || '',
            description: metadata.description || '',
            source: metadata.source || '',
            version: Number(metadata.version || 1),
            type: metadata.type || type,
            locale: metadata.locale || 'vi_VN',
            relativePath: `extensions/${type}/${folder}`,
            metadata
        };
    }
    
    const rootCatalog = {};
    const builtInfo = [];
    
    for (const type of types) {
        const typeDir = path.join(extRoot, type);
        let entries = [];
        if (fs.existsSync(typeDir)) {
            const names = fs.readdirSync(typeDir, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name)
                .sort((a, b) => a.localeCompare(b));
            entries = names.map(name => buildEntry(type, name)).filter(Boolean);
        }
        fs.mkdirSync(typeDir, { recursive: true });
        fs.writeFileSync(path.join(typeDir, 'plugin.json'), JSON.stringify(entries, null, 2) + '\n', 'utf8');
        rootCatalog[type] = entries;
        builtInfo.push({
            type,
            count: entries.length,
            path: `extensions/${type}/plugin.json`
        });
    }
    
    fs.writeFileSync(path.join(extRoot, 'plugin.json'), JSON.stringify(rootCatalog, null, 2) + '\n', 'utf8');
    builtInfo.push({
        type: 'root',
        count: Object.values(rootCatalog).flat().length,
        path: 'extensions/plugin.json'
    });
    
    return {
        success: true,
        rebuilt: true,
        files: builtInfo,
        total: Object.values(rootCatalog).flat().length,
        message: `Built catalog: ${builtInfo.map(b => `${b.type}=${b.count}`).join(', ')}`
    };
}

module.exports = {
    buildCatalog
};
