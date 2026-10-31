const { 
    runDevicePing, 
    runDeviceDebug, 
    runDeviceInstall, 
    runDeviceTestAll 
} = require('../device/commands');

async function handleDevicePing(options) {
    const result = await runDevicePing(options);
    console.log(`[OK] Device reachable at ${result.ip}:${result.port}`);
    return true;
}

async function handleDeviceDebug(file, subOptions, parentCommand) {
    const opts = { ...parentCommand.opts(), ...subOptions };
    const result = await runDeviceDebug(file, opts);

    if (result.log) {
        console.log('[LOG FROM DEVICE]');
        const logStr = typeof result.log === 'string' ? result.log.replace(/\\n/g, '\n') : JSON.stringify(result.log, null, 2);
        console.log(logStr);
    }

    if (result.exception) {
        console.warn('[EXCEPTION FROM DEVICE]');
        const excStr = typeof result.exception === 'string' ? result.exception.replace(/\\n/g, '\n') : JSON.stringify(result.exception, null, 2);
        console.warn(excStr);
        return false;
    }

    if (typeof result.result !== 'undefined') {
        console.log('[RESULT]');
        console.log(JSON.stringify(result.result, null, 2));
    } else {
        console.log('[RESPONSE]');
        console.log(JSON.stringify(result.raw, null, 2));
    }
    return true;
}

async function handleDeviceInstall(subOptions, parentCommand) {
    const opts = { ...parentCommand.opts(), ...subOptions };
    const result = await runDeviceInstall(subOptions.plugin || '.', opts);
    if (result.exception) {
        console.warn('[FAILED]');
        console.warn(typeof result.exception === 'string' ? result.exception : JSON.stringify(result.exception, null, 2));
        return false;
    }
    console.log('[SUCCESS] Install request sent.');
    if (result.result) {
        console.log(JSON.stringify(result.result, null, 2));
    }
    return true;
}

async function handleDeviceTestAll(subOptions, parentCommand) {
    const opts = { ...parentCommand.opts(), ...subOptions };
    await runDeviceTestAll(subOptions.plugin || '.', opts);
    console.log('[SUCCESS] One-click test completed successfully!');
    return true;
}

module.exports = {
    handleDevicePing,
    handleDeviceDebug,
    handleDeviceInstall,
    handleDeviceTestAll
};
