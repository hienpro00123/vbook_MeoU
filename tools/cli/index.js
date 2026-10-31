#!/usr/bin/env node

const path = require('path');
const { Command } = require('commander');
const { handleExtCommand } = require('./commands/ext');
const { handleBuildCommand } = require('./commands/build');
const { handleCatalogCommand } = require('./commands/catalog');
const { handleVerifyCommand } = require('./commands/verify');
const { 
    handleDevicePing, 
    handleDeviceDebug, 
    handleDeviceInstall, 
    handleDeviceTestAll 
} = require('./commands/device');
const { handleValidateCommand } = require('./commands/validate');
const { handleAnalyzeCommand } = require('./commands/analyze');
const { handlePublishCommand } = require('./commands/publish');
const { handleCheckEnvCommand } = require('./commands/check-env');
const { handleSyncRefCommand } = require('./commands/sync-ref');


const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(WORKSPACE_ROOT, '.env') });

if (!process.env.VBOOK_AUTHOR && process.env.author) {
    process.env.VBOOK_AUTHOR = process.env.author;
}

const program = new Command();

program
    .name('vbook')
    .description('VBook CLI - Tools for extension developers (v3 Modular)')
    .version('3.0.0');

program.command('connect')
    .description('Connect and probe local VBook REST-API server')
    .option('--server <url>', 'VBook server URL')
    .action(() => {
        const { fork } = require('child_process');
        fork(path.join(__dirname, 'vbook.js'), process.argv.slice(2), { stdio: 'inherit' });
    });

program.command('test')
    .description('Test an extension script via official REST-API server')
    .argument('<ext-dir>', 'Extension directory')
    .argument('<script>', 'Script file name (e.g. detail.js)')
    .argument('[args...]', 'Arguments passed to execute()')
    .option('--server <url>', 'VBook server URL')
    .action(() => {
        const { fork } = require('child_process');
        fork(path.join(__dirname, 'vbook.js'), process.argv.slice(2), { stdio: 'inherit' });
    });

program.command('ext')
    .description('Tao moi hoac sua metadata extension')
    .option('--mode <mode>', 'create|edit', 'create')
    .option('--from-reference <path>', 'Thu muc tham chieu hoc tap', '.private/code-reference/_unknown/example')
    .option('--name <name>', 'Extension display name')
    .option('--folder <folder>', 'Output folder slug')
    .option('--source <url>', 'Source website URL')
    .option('--type <type>', 'novel|comic|chinese_novel|translate|tts', 'novel')
    .option('--locale <locale>', 'vi_VN|zh_CN|en_US', 'vi_VN')
    .option('--author <author>', 'Metadata author')
    .option('--description <text>', 'Metadata description')
    .option('--regexp <regex>', 'Metadata regexp')
    .option('--plugin <path>', 'Extension folder or plugin.json')
    .option('--version <n>', 'Set metadata.version')
    .option('--bump-version', 'Increase metadata.version by 1')
    .option('--dry-run', 'Preview only')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const success = await handleExtCommand(options, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });

program.command('build')
    .description('Build extension to plugin.zip')
    .option('--plugin <path>', 'Extension folder or plugin.json path', 'extensions/novel/kychi_ntruyen')
    .option('--verify', 'Check if existing plugin.zip is up-to-date with src/')
    .option('--dry-run', 'Preview only')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const success = await handleBuildCommand(options, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });

program.command('verify')
    .description('Full project consistency check (catalog sync + ZIP integrity)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const success = await handleVerifyCommand(options, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });

program.command('build-catalog')
    .description('Rebuild extension catalog from extensions/ directory')
    .option('--json', 'Output as JSON')
    .action((options) => {
        const success = handleCatalogCommand(options, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });

program.command('validate')
    .description('Check extension for Rhino compatibility and required patterns')
    .option('--plugin <path>', 'Extension folder or plugin.json path')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const success = await handleValidateCommand(options, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });

program.command('analyze')
    .description('Analyze a URL to suggest selectors and code snippets')
    .argument('[url]', 'Target website URL')
    .option('--json', 'Output as JSON')
    .action(async (url, options) => {
        const success = await handleAnalyzeCommand({ ...options, url }, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });

program.command('publish')
    .description('Prepare and verify project for publication')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const success = await handlePublishCommand(options, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });

program.command('check-env')
    .description('Verify the development environment (.env configuration)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const success = await handleCheckEnvCommand(options, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });

program.command('sync-ref')
    .description('Sync community repos and merge extensions into .private/code-reference')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        const success = await handleSyncRefCommand(options, WORKSPACE_ROOT);
        if (!success) process.exitCode = 1;
    });


program.command('device')
    .description('Debug/install extension on VBook device (TCP bridge)')
    .option('-i, --ip <ip>', 'Device IP address')
    .option('-p, --port <port>', 'Device port', '8080')
    .option('--timeout-ms <n>', 'TCP timeout', '60000')
    .option('--verbose', 'Verbose network logs')
    .addCommand(
        new Command('ping')
            .description('Check TCP connectivity to device')
            .action(async (...args) => {
                const command = args[args.length - 1];
                const success = await handleDevicePing(command.parent.opts());
                if (!success) process.exitCode = 1;
            })
    )
    .addCommand(
        new Command('debug')
            .description('Debug a script on the device')
            .argument('<file>', 'Path to the script')
            .option('-in, --input <input>', 'Input args string')
            .action(async (file, subOptions, ...rest) => {
                const command = rest[rest.length - 1];
                const success = await handleDeviceDebug(file, subOptions, command.parent);
                if (!success) process.exitCode = 1;
            })
    )
    .addCommand(
        new Command('install')
            .description('Install the extension on the device')
            .option('--plugin <path>', 'Extension folder path')
            .action(async (subOptions, ...rest) => {
                const command = rest[rest.length - 1];
                const success = await handleDeviceInstall(subOptions, command.parent);
                if (!success) process.exitCode = 1;
            })
    )
    .addCommand(
        new Command('test-all')
            .description('One-click test (home -> gen -> detail -> toc -> chap)')
            .option('--plugin <path>', 'Extension folder path')
            .action(async (subOptions, ...rest) => {
                const command = rest[rest.length - 1];
                const success = await handleDeviceTestAll(subOptions, command.parent);
                if (!success) process.exitCode = 1;
            })
    );

program.parse(process.argv);
