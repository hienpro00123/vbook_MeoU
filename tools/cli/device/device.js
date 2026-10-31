const fs = require('fs');
const path = require('path');
const http = require('http');
const { getLocalIP } = require('./utils');

function resolveWorkspaceRoot() {
    return path.resolve(__dirname, '..', '..', '..');
}

function getPluginInfo(targetPath) {
    let currentDir = path.resolve(targetPath || '.');

    if (!fs.existsSync(path.join(currentDir, 'plugin.json'))) {
        const folderName = path.basename(currentDir);
        if (folderName === 'src') {
            currentDir = path.dirname(currentDir);
        }
    }

    const pluginJsonPath = path.join(currentDir, 'plugin.json');
    if (!fs.existsSync(pluginJsonPath)) {
        throw new Error(`plugin.json not found in ${currentDir}. Please point --plugin to an extension folder.`);
    }

    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    return {
        root: currentDir,
        name: path.basename(currentDir),
        json: pluginJson
    };
}

function readScriptFile(pluginRoot, scriptRelPath) {
    const fullPath = path.resolve(pluginRoot, scriptRelPath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }

    return {
        fullPath,
        content: fs.readFileSync(fullPath, 'utf8')
    };
}

function startFileServer(pluginInfo, options = {}) {
    const localPort = Number(options.localPort || process.env.LOCAL_PORT || 8080);
    const localIP = options.localIP || getLocalIP();
    const listenHost = options.listenHost || process.env.VBOOK_LOCAL_LISTEN_HOST || '0.0.0.0';

    const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const fileName = url.searchParams.get('file');

        if (!fileName) {
            res.writeHead(400);
            return res.end('Missing file param');
        }

        let requestedPath = path.join(pluginInfo.root, fileName);
        if (!fs.existsSync(requestedPath)) {
            requestedPath = path.join(pluginInfo.root, 'src', fileName);
        }

        if (fs.existsSync(requestedPath)) {
            const content = fs.readFileSync(requestedPath);
            const base64 = content.toString('base64');
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(base64);
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    });

    return new Promise((resolve, reject) => {
        server.on('error', (e) => reject(e));
        server.listen(localPort, listenHost, () => {
            resolve({
                server,
                localIP,
                localPort,
                baseUrl: `http://${localIP}:${localPort}`
            });
        });
    });
}

function buildDeviceTestRequest({
    deviceIp,
    devicePort,
    localBaseUrl,
    rootName,
    scriptContent,
    input
}) {
    const requestData = {
        input: Array.isArray(input) ? input : [],
        ip: localBaseUrl,
        root: rootName,
        language: 'javascript',
        script: scriptContent
    };

    const base64Data = Buffer.from(JSON.stringify(requestData)).toString('base64');

    return (
        `GET /extension/test HTTP/1.1\r\n` +
        `Host: ${deviceIp}:${devicePort}\r\n` +
        `Connection: close\r\n` +
        `User-Agent: okhttp/3.12.6\r\n` +
        `Accept-Encoding: gzip\r\n` +
        `data: ${base64Data}\r\n\r\n`
    );
}

function buildDeviceInstallRequest({
    deviceIp,
    devicePort,
    payload
}) {
    const base64Data = Buffer.from(JSON.stringify(payload)).toString('base64');

    return (
        `GET /extension/install HTTP/1.1\r\n` +
        `Host: ${deviceIp}:${devicePort}\r\n` +
        `Connection: close\r\n` +
        `data: ${base64Data}\r\n\r\n`
    );
}

function extractDeviceResult(raw) {
    if (!raw || typeof raw !== 'object') {
        return { raw };
    }

    const log = raw.log;
    const exception = raw.exception;
    const resultValue = raw.result;

    let result = resultValue;
    if (typeof result === 'string') {
        try {
            result = JSON.parse(result);
        } catch {
            // keep string
        }
    }

    return {
        log,
        exception,
        result,
        raw
    };
}

module.exports = {
    resolveWorkspaceRoot,
    getPluginInfo,
    readScriptFile,
    startFileServer,
    buildDeviceTestRequest,
    buildDeviceInstallRequest,
    extractDeviceResult
};
