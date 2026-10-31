const fs = require('fs');
const path = require('path');
const stringArgv = require('string-argv').default;

const {
    getPluginInfo,
    readScriptFile,
    startFileServer,
    buildDeviceTestRequest,
    buildDeviceInstallRequest,
    extractDeviceResult
} = require('./device');

const { sendRequest, pingDevice } = require('./utils');

function resolveDeviceOptions(options = {}) {
    const deviceIp = String(options.ip || process.env.VBOOK_IP || '').trim();
    const devicePort = Number(options.port || process.env.VBOOK_PORT || 8080);
    const timeoutMs = Number(options.timeoutMs || process.env.VBOOK_DEVICE_TIMEOUT_MS || 60000);

    if (!deviceIp) {
        throw new Error('Missing device IP. Set VBOOK_IP in .env or pass --ip');
    }

    return {
        deviceIp,
        devicePort,
        timeoutMs,
        verbose: Boolean(options.verbose || String(process.env.VERBOSE || '').toLowerCase() === 'true')
    };
}

function parseInputArg(inputStr) {
    const raw = String(inputStr || '').trim();
    if (!raw) return [];
    return stringArgv(raw);
}

async function runDeviceDebug(scriptPath, options) {
    const { deviceIp, devicePort, verbose, timeoutMs } = resolveDeviceOptions(options);

    const resolvedScriptPath = path.resolve(scriptPath);
    if (!fs.existsSync(resolvedScriptPath)) {
        throw new Error(`File not found: ${resolvedScriptPath}`);
    }

    const pluginInfo = getPluginInfo(path.dirname(resolvedScriptPath));
    const rootName = `${pluginInfo.name}/src`;

    const { content: scriptContent } = readScriptFile(pluginInfo.root, path.relative(pluginInfo.root, resolvedScriptPath));

    const serverInfo = await startFileServer(pluginInfo, {
        localPort: Number(process.env.LOCAL_PORT || 8080)
    });

    try {
        const input = parseInputArg(options.input);

        console.log(`[DEBUG] Target: ${deviceIp}:${devicePort}`);
        console.log(`[DEBUG] Local Server: ${serverInfo.baseUrl}`);

        const rawRequest = buildDeviceTestRequest({
            deviceIp,
            devicePort,
            localBaseUrl: serverInfo.baseUrl,
            rootName,
            scriptContent,
            input
        });

        const response = await sendRequest(deviceIp, devicePort, rawRequest, { verbose, timeoutMs });
        return extractDeviceResult(response);
    } finally {
        serverInfo.server.close();
    }
}

async function runDevicePing(options) {
    const { deviceIp, devicePort, timeoutMs } = resolveDeviceOptions(options);
    await pingDevice(deviceIp, devicePort, { timeoutMs: Math.min(timeoutMs, 5000) });
    return { ok: true, ip: deviceIp, port: devicePort };
}

async function runDeviceInstall(pluginPath, options) {
    const { deviceIp, devicePort, verbose, timeoutMs } = resolveDeviceOptions(options);

    const pluginInfo = getPluginInfo(pluginPath || '.');
    const iconPath = path.join(pluginInfo.root, 'icon.png');
    if (!fs.existsSync(iconPath)) {
        throw new Error('icon.png not found');
    }

    const metadata = { ...(pluginInfo.json && pluginInfo.json.metadata ? pluginInfo.json.metadata : {}) };
    if (metadata.encrypt) {
        delete metadata.encrypt;
    }

    const payload = {
        ...metadata,
        ...(pluginInfo.json && pluginInfo.json.script ? pluginInfo.json.script : {}),
        id: `debug-${metadata.source || pluginInfo.name}`,
        icon: `data:image/*;base64,${fs.readFileSync(iconPath).toString('base64')}`,
        enabled: true,
        debug: true,
        data: {}
    };

    const srcDir = path.join(pluginInfo.root, 'src');
    const files = fs.existsSync(srcDir) ? fs.readdirSync(srcDir).filter((f) => f.endsWith('.js')) : [];
    for (const file of files) {
        payload.data[file] = fs.readFileSync(path.join(srcDir, file), 'utf8');
    }
    payload.data = JSON.stringify(payload.data);

    console.log(`[INSTALL] Installing ${pluginInfo.name} to ${deviceIp}:${devicePort}...`);

    const rawRequest = buildDeviceInstallRequest({
        deviceIp,
        devicePort,
        payload
    });

    const response = await sendRequest(deviceIp, devicePort, rawRequest, { verbose, timeoutMs });
    return extractDeviceResult(response);
}

async function runDeviceTestAll(pluginPath, options) {
    const { deviceIp, devicePort, verbose, timeoutMs } = resolveDeviceOptions(options);

    const pluginInfo = getPluginInfo(pluginPath || '.');
    const rootName = `${pluginInfo.name}/src`;

    const serverInfo = await startFileServer(pluginInfo, {
        localPort: Number(process.env.LOCAL_PORT || 8080)
    });

    async function runScript(scriptName, input) {
        const script = readScriptFile(pluginInfo.root, path.join('src', scriptName));

        const rawRequest = buildDeviceTestRequest({
            deviceIp,
            devicePort,
            localBaseUrl: serverInfo.baseUrl,
            rootName,
            scriptContent: script.content,
            input
        });

        const response = await sendRequest(deviceIp, devicePort, rawRequest, { verbose, timeoutMs });
        const extracted = extractDeviceResult(response);

        if (extracted.log) {
            const logStr = typeof extracted.log === 'string'
                ? extracted.log.replace(/\\n/g, '\n')
                : JSON.stringify(extracted.log, null, 2);
            console.log('[LOG FROM DEVICE]');
            console.log(logStr);
        }

        if (extracted.exception) {
            const excStr = typeof extracted.exception === 'string'
                ? extracted.exception.replace(/\\n/g, '\n')
                : JSON.stringify(extracted.exception, null, 2);
            throw new Error(`Exception in ${scriptName}: ${excStr}`);
        }

        const result = extracted.result && extracted.result.data ? extracted.result.data : extracted.result;
        return result;
    }

    try {
        console.log(`[ONE-CLICK] Starting test for ${pluginInfo.name}...`);
        console.log(`[DEBUG] Target: ${deviceIp}:${devicePort}`);
        console.log(`[DEBUG] Local Server: ${serverInfo.baseUrl}`);

        const homeData = await runScript('home.js', []);
        if (!homeData || !homeData.length) {
            throw new Error('home.js returned no data');
        }
        console.log(`[HOME] Got ${homeData.length} items`);

        const firstItem = homeData[0];
        if (!firstItem || !firstItem.script) {
            throw new Error('home.js item missing script');
        }

        const genData = await runScript(firstItem.script, [firstItem.input]);
        if (!genData || !genData.length) {
            throw new Error(`${firstItem.script} returned no data`);
        }
        console.log(`[GEN] Got ${genData.length} items`);

        const firstBook = genData[0];
        let detailUrl = firstBook.link;
        if (firstBook.host && detailUrl && !String(detailUrl).startsWith('http')) {
            const base = String(firstBook.host).endsWith('/') ? firstBook.host : `${firstBook.host}/`;
            detailUrl = `${base}${String(detailUrl).startsWith('/') ? String(detailUrl).slice(1) : detailUrl}`;
        }

        const detailData = await runScript('detail.js', [detailUrl]);
        console.log(`[DETAIL] Got details for: ${detailData && detailData.name ? detailData.name : 'unknown'}`);

        const tocData = await runScript('toc.js', [detailUrl]);
        if (!tocData || !tocData.length) {
            throw new Error('toc.js returned no chapters');
        }
        console.log(`[TOC] Got ${tocData.length} chapters`);

        const firstChap = tocData[0];
        let chapUrl = firstChap.url;
        if (firstChap.host && chapUrl && !String(chapUrl).startsWith('http')) {
            const base = String(firstChap.host).endsWith('/') ? firstChap.host : `${firstChap.host}/`;
            chapUrl = `${base}${String(chapUrl).startsWith('/') ? String(chapUrl).slice(1) : chapUrl}`;
        }

        const chapData = await runScript('chap.js', [chapUrl]);
        const chapLen = chapData ? String(chapData).length : 0;
        console.log(`[CHAP] Content length: ${chapLen} chars`);

        return { ok: true };
    } finally {
        serverInfo.server.close();
    }
}

module.exports = {
    runDevicePing,
    runDeviceDebug,
    runDeviceInstall,
    runDeviceTestAll
};
