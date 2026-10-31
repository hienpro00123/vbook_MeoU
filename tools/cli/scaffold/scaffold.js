const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');

const ALLOWED_TYPES = ['novel', 'comic', 'video', 'audio', 'chinese_novel', 'translate', 'tts'];
const ALLOWED_LOCALES = ['vi_VN', 'zh_CN', 'en_US'];

function slugifyName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function ensureUrl(input) {
    const value = String(input || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
}

function escapeRegexHost(hostname) {
    return hostname.replace(/\./g, '\\.');
}

function buildDefaultRegexp(sourceUrl) {
    try {
        const hostname = new URL(sourceUrl).hostname;
        const escaped = escapeRegexHost(hostname);
        return `${escaped}/[^/]+/?$`;
    } catch (error) {
        return 'example\\.com/novel/[^/]+/?$';
    }
}

function copyDirRecursive(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function askIfMissing(config, key, prompt, fallback = '') {
    if (config[key]) return;
    if (!process.stdin.isTTY) {
        throw new Error(`Missing required option --${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`);
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answer = await rl.question(`${prompt}${fallback ? ` (${fallback})` : ''}: `);
        config[key] = (answer || fallback || '').trim();
    } finally {
        rl.close();
    }
}

function resolveDefaultTemplateDir(workspaceRoot, type) {
    const agentTemplate = path.join(workspaceRoot, '.agents', 'skills', 'vbook-extensions', 'templates', type);
    if (fs.existsSync(agentTemplate)) return agentTemplate;
    const rootTemplate = path.join(workspaceRoot, 'templates', type);
    if (fs.existsSync(rootTemplate)) return rootTemplate;
    const skillTemplate = path.join(workspaceRoot, '.claude', 'skills', 'vbook-extensions', 'templates', type);
    if (fs.existsSync(skillTemplate)) return skillTemplate;
    return path.join(workspaceRoot, 'code-reference', '_unknown', 'example');
}

function parseAndNormalizeOptions(workspaceRoot, options = {}) {
    const source = ensureUrl(options.source);
    const name = String(options.name || '').trim();
    const type = String(options.type || 'novel').trim();
    const locale = String(options.locale || 'vi_VN').trim();
    const author = String(options.author || process.env.VBOOK_AUTHOR || 'kychi').trim();

    const rawSlug = slugifyName(name).replace(/-/g, '_');
    const authorPrefix = `${slugifyName(author)}_`;
    const defaultFolder = rawSlug.startsWith(authorPrefix) ? rawSlug : `${authorPrefix}${rawSlug}`;
    const folderName = options.folder ? slugifyName(options.folder) : defaultFolder;

    const templateDir = path.resolve(
        options.template || resolveDefaultTemplateDir(workspaceRoot, type)
    );

    const outputDir = path.resolve(
        options.output || path.join(workspaceRoot, 'extensions', type, folderName)
    );
    const description = String(options.description || `Generated extension for ${source}`).trim();
    const regexp = String(options.regexp || buildDefaultRegexp(source)).trim();

    if (!name) throw new Error('Extension name is required.');
    if (!source) throw new Error('Source URL is required.');
    if (!folderName) throw new Error('Unable to build target folder name from extension name.');
    if (!ALLOWED_TYPES.includes(type)) {
        throw new Error(`Unsupported type: ${type}. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }
    if (!ALLOWED_LOCALES.includes(locale)) {
        throw new Error(`Unsupported locale: ${locale}. Allowed: ${ALLOWED_LOCALES.join(', ')}`);
    }

    return {
        name,
        folderName,
        source,
        type,
        locale,
        author,
        description,
        regexp,
        templateDir,
        outputDir,
        dryRun: Boolean(options.dryRun),
        force: Boolean(options.force)
    };
}

function updateGeneratedPluginJson(config, outputDir) {
    const pluginPath = path.join(outputDir, 'plugin.json');
    if (!fs.existsSync(pluginPath)) {
        throw new Error('Template plugin.json not found after scaffold copy.');
    }

    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
    plugin.metadata = plugin.metadata || {};
    plugin.script = plugin.script || {};

    plugin.metadata.name = config.name;
    plugin.metadata.author = config.author;
    plugin.metadata.version = 1;
    plugin.metadata.source = config.source;
    plugin.metadata.regexp = config.regexp;
    plugin.metadata.description = config.description;
    plugin.metadata.locale = config.locale;
    plugin.metadata.language = 'javascript';
    plugin.metadata.type = config.type;

    fs.writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`, 'utf8');
}

function resolvePluginJsonPath(workspaceRoot, pluginOption) {
    const rawPath = String(pluginOption || '').trim();
    if (!rawPath) {
        throw new Error('Missing --plugin path for edit mode.');
    }

    const candidate = path.resolve(workspaceRoot, rawPath);
    if (!fs.existsSync(candidate)) {
        throw new Error(`Plugin path not found: ${candidate}`);
    }

    const stat = fs.statSync(candidate);
    if (stat.isFile()) {
        if (path.basename(candidate) !== 'plugin.json') {
            throw new Error('--plugin must be an extension folder or plugin.json file.');
        }
        return candidate;
    }

    const pluginPath = path.join(candidate, 'plugin.json');
    if (!fs.existsSync(pluginPath)) {
        throw new Error(`plugin.json not found in: ${candidate}`);
    }

    return pluginPath;
}

function updateExistingExtension(workspaceRoot, options = {}) {
    const pluginPath = resolvePluginJsonPath(workspaceRoot, options.plugin);
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
    const metadata = plugin.metadata || {};

    const next = { ...metadata };
    const updates = [];

    function applyField(field, value, transform) {
        if (value === undefined || value === null || value === '') {
            return;
        }
        const nextValue = transform ? transform(value) : String(value).trim();
        if (String(next[field] || '') !== String(nextValue || '')) {
            next[field] = nextValue;
            updates.push(field);
        }
    }

    applyField('name', options.name);
    applyField('source', options.source, ensureUrl);
    applyField('author', options.author);
    applyField('description', options.description);
    applyField('regexp', options.regexp);

    if (options.type) {
        const type = String(options.type).trim();
        if (!ALLOWED_TYPES.includes(type)) {
            throw new Error(`Unsupported type: ${type}. Allowed: ${ALLOWED_TYPES.join(', ')}`);
        }
        applyField('type', type);
    }

    if (options.locale) {
        const locale = String(options.locale).trim();
        if (!ALLOWED_LOCALES.includes(locale)) {
            throw new Error(`Unsupported locale: ${locale}. Allowed: ${ALLOWED_LOCALES.join(', ')}`);
        }
        applyField('locale', locale);
    }

    if (options.version !== undefined) {
        const version = parseInt(options.version, 10);
        if (!Number.isInteger(version) || version < 1) {
            throw new Error('--version must be an integer >= 1.');
        }
        if (Number(next.version || 0) !== version) {
            next.version = version;
            updates.push('version');
        }
    }

    if (options.bumpVersion) {
        const currentVersion = Number(next.version || 0);
        next.version = currentVersion + 1;
        updates.push('version');
    }

    const dryRun = Boolean(options.dryRun);
    if (!updates.length) {
        return {
            success: true,
            updated: false,
            dryRun,
            pluginPath: path.relative(workspaceRoot, pluginPath),
            metadata: next,
            message: 'No metadata changes detected.'
        };
    }

    if (!dryRun) {
        plugin.metadata = next;
        fs.writeFileSync(pluginPath, `${JSON.stringify(plugin, null, 2)}\n`, 'utf8');
    }

    return {
        success: true,
        updated: !dryRun,
        dryRun,
        pluginPath: path.relative(workspaceRoot, pluginPath),
        changedFields: Array.from(new Set(updates)),
        metadata: next
    };
}

function scaffoldExtension(workspaceRoot, options = {}) {
    const config = parseAndNormalizeOptions(workspaceRoot, options);

    if (!fs.existsSync(config.templateDir)) {
        throw new Error(`Template directory not found: ${config.templateDir}`);
    }

    if (fs.existsSync(config.outputDir) && !config.force) {
        throw new Error(`Output directory already exists: ${config.outputDir} (use --force to overwrite)`);
    }

    const planned = {
        name: config.name,
        outputDir: path.relative(workspaceRoot, config.outputDir),
        templateDir: path.relative(workspaceRoot, config.templateDir),
        metadata: {
            source: config.source,
            type: config.type,
            locale: config.locale,
            author: config.author,
            regexp: config.regexp
        },
        dryRun: config.dryRun
    };

    if (config.dryRun) {
        return {
            success: true,
            generated: false,
            ...planned
        };
    }

    if (fs.existsSync(config.outputDir) && config.force) {
        fs.rmSync(config.outputDir, { recursive: true, force: true });
    }

    copyDirRecursive(config.templateDir, config.outputDir);
    updateGeneratedPluginJson(config, config.outputDir);

    return {
        success: true,
        generated: true,
        ...planned
    };
}

module.exports = {
    scaffoldExtension,
    updateExistingExtension,
    askIfMissing,
    ALLOWED_TYPES,
    ALLOWED_LOCALES
};
