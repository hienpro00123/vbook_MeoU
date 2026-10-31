const fs = require('fs');
const path = require('path');

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/hienpro00123/vbook_MeoU/main';

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
            author: metadata.author || 'Meo',
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
    const publicData = [];
    
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

        // Format for public root catalog
        for (const e of entries) {
            const m = e.metadata || {};
            const pubEntry = {
                name: e.name,
                author: e.author,
                path: `${GITHUB_RAW_BASE}/${e.relativePath}/plugin.zip`,
                version: e.version,
                source: e.source,
                icon: `${GITHUB_RAW_BASE}/${e.relativePath}/icon.png`,
                description: e.description,
                type: e.type,
                locale: e.locale
            };
            if (m.tag) pubEntry.tag = m.tag;
            if (typeof m.nsfw !== 'undefined') pubEntry.nsfw = m.nsfw;
            publicData.push(pubEntry);
        }
    }
    
    // Write extensions/plugin.json
    fs.writeFileSync(path.join(extRoot, 'plugin.json'), JSON.stringify(rootCatalog, null, 2) + '\n', 'utf8');
    builtInfo.push({
        type: 'extensions-catalog',
        count: Object.values(rootCatalog).flat().length,
        path: 'extensions/plugin.json'
    });

    // Write root plugin.json (public catalog for vBook app)
    const publicCatalog = {
        metadata: {
            author: 'Meo',
            description: 'VBook Extensions Repository - Đọc truyện, xem anime, công cụ dịch thuật và TTS'
        },
        data: publicData
    };
    fs.writeFileSync(path.join(workspaceRoot, 'plugin.json'), JSON.stringify(publicCatalog, null, 2) + '\n', 'utf8');
    builtInfo.push({
        type: 'root-public',
        count: publicData.length,
        path: 'plugin.json'
    });
    
    return {
        success: true,
        rebuilt: true,
        files: builtInfo,
        total: publicData.length,
        message: `Built catalog: ${builtInfo.map(b => `${b.type}=${b.count}`).join(', ')}`
    };
}

module.exports = {
    buildCatalog
};
