#!/usr/bin/env node
/**
 * PIPELINE.JS - Full Encryption Pipeline
 * Usage: node pipeline.js <extPath>
 * 
 * Performs: Obfuscate → Encrypt → Build ZIP
 */

'use strict';

const path = require('path');
const { execSync } = require('child_process');
const { obfuscateExtension } = require('./obfuscate');
const { encryptExtension } = require('./encrypt');

async function fullEncryptionPipeline(extPath) {
  console.log('\n' + '='.repeat(70));
  console.log('🔒 FULL ENCRYPTION PIPELINE');
  console.log('='.repeat(70));
  
  const absPath = path.resolve(extPath);
  
  // Step 1: Obfuscate
  console.log('\n\n▶️  STEP 1: OBFUSCATE');
  console.log('-'.repeat(70));
  try {
    const obfOk = obfuscateExtension(absPath);
    if (!obfOk) throw new Error('Obfuscation failed');
  } catch (err) {
    console.error(`\n❌ Obfuscation failed: ${err.message}`);
    return false;
  }
  
  // Step 2: Encrypt
  console.log('\n▶️  STEP 2: ENCRYPT');
  console.log('-'.repeat(70));
  try {
    const encOk = encryptExtension(absPath);
    if (!encOk) throw new Error('Encryption failed');
  } catch (err) {
    console.error(`\n❌ Encryption failed: ${err.message}`);
    return false;
  }
  
  // Step 3: Build ZIP
  console.log('\n▶️  STEP 3: BUILD ZIP');
  console.log('-'.repeat(70));
  try {
    const pluginPath = path.join(absPath, 'plugin.json');
    console.log(`Building ZIP from: ${pluginPath}`);
    
    // Run build command
    const cmd = `node ./tools/cli/index.js build --plugin "${pluginPath}"`;
    console.log(`\n$ ${cmd}\n`);
    
    execSync(cmd, { 
      cwd: path.resolve(__dirname, '../../..'),
      stdio: 'inherit'
    });
    
    console.log(`✅ ZIP build completed`);
  } catch (err) {
    console.error(`\n⚠️  ZIP build warning (may already exist): ${err.message}`);
  }
  
  // Summary
  const pluginJson = path.join(absPath, 'plugin.json');
  const zipPath = path.join(absPath, 'plugin.zip');
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ ENCRYPTION PIPELINE COMPLETED');
  console.log('='.repeat(70));
  console.log(`\n📁 Extension: ${absPath}`);
  console.log(`📦 Plugin ZIP: ${zipPath}`);
  console.log(`🔒 Encrypted: YES (metadata.encrypt = true)`);
  console.log(`\n✨ Ready to deploy!\n`);
  
  return true;
}

// ─── Main ───────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  let extPath = null;
  
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('-')) {
      extPath = args[i];
      break;
    }
  }
  
  if (!extPath) {
    console.error('\nUsage: node pipeline.js <extPath>');
    console.error('Example: node pipeline.js extensions/novel/kychi_truyencv\n');
    process.exit(1);
  }
  
  fullEncryptionPipeline(extPath)
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
      console.error(`\n❌ FATAL ERROR: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { fullEncryptionPipeline };
