const fs = require('fs');
const path = require('path');

async function handleCheckEnvCommand(options, workspaceRoot) {
    const envPath = path.join(workspaceRoot, '.env');
    console.log('\nVBook Environment Check');
    console.log('======================');

    if (!fs.existsSync(envPath)) {
        console.warn('[WARNING] .env file not found at project root.');
        console.log('Suggestion: Create a .env file to enable remote device features.');
        return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const requiredKeys = ['VBOOK_IP', 'VBOOK_PORT', 'LOCAL_PORT', 'VBOOK_AUTHOR'];
    let allOk = true;

    requiredKeys.forEach(key => {
        if (env[key]) {
            console.log(`✓ ${key}: ${env[key]}`);
        } else {
            console.warn(`✗ ${key}: MISSING`);
            allOk = false;
        }
    });

    if (allOk) {
        console.log('\n[SUCCESS] Environment is fully configured for V3 development.');
    } else {
        console.warn('\n[ISSUE] Some environment variables are missing. Checkout README.md for setup.');
    }

    return allOk;
}

module.exports = { handleCheckEnvCommand };
