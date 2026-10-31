const os = require('os');
const net = require('net');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    const preferredInterfaces = ['Wi-Fi', 'Ethernet', 'en0', 'wlan0'];

    for (const name of preferredInterfaces) {
        const ifaces = interfaces[name];
        if (ifaces) {
            for (const iface of ifaces) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }

    for (const name of Object.keys(interfaces)) {
        const ifaces = interfaces[name];
        if (ifaces) {
            for (const iface of ifaces) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
    }

    return '127.0.0.1';
}

async function sendRequest(ip, port, rawRequest, options = {}) {
    const verbose = Boolean(options.verbose);
    const timeoutMs = Number(options.timeoutMs || 15000);

    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let responseData = '';

        client.connect(port, ip, () => {
            if (verbose) {
                console.log(`[TCP] Connected to ${ip}:${port}`);
            }
            client.write(rawRequest);
        });

        client.on('data', (data) => {
            responseData += data.toString();
        });

        client.on('end', () => {
            try {
                const bodyStartIndex = responseData.indexOf('{');
                if (bodyStartIndex < 0) {
                    return resolve(responseData);
                }
                const body = responseData.substring(bodyStartIndex);
                resolve(JSON.parse(body));
            } catch (error) {
                resolve(responseData);
            }
        });

        client.on('error', (error) => {
            reject(error);
        });

        client.setTimeout(timeoutMs, () => {
            client.destroy();
            reject(new Error('Connection timeout'));
        });
    });
}

async function pingDevice(ip, port, options = {}) {
    const timeoutMs = Number(options.timeoutMs || 5000);

    return new Promise((resolve, reject) => {
        const client = new net.Socket();
        let settled = false;

        function done(err) {
            if (settled) return;
            settled = true;
            try {
                client.destroy();
            } catch {
            }
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        }

        client.setTimeout(timeoutMs, () => done(new Error('Connection timeout')));
        client.on('error', done);
        client.connect(port, ip, () => done(null));
    });
}

module.exports = {
    getLocalIP,
    sendRequest,
    pingDevice
};
