#!/usr/bin/env node
/**
 * ENCRYPT.JS - Encrypt Obfuscated JavaScript Files
 * Usage: node encrypt.js <extPath>
 * 
 * Input:  plugin.json + src/*.bundle.js (obfuscated)
 * Output: src/*.encrypted.js (AES-256-CBC encrypted)
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ─── Key Generation ─────────────────────────────────────────────────────────

function generateEncryptionKey(metadata) {
  // Build payload: salt + source + author
  const SALT = 'com.vbook.app';
  const source = (metadata.source || '').trim();
  const author = (metadata.author || '').trim();
  
  const payload = `${SALT}${source}${author}`;
  
  // Step 1: MD5(payload) → hex string
  const hexKey = crypto.createHash('md5')
    .update(payload, 'utf8')
    .digest('hex');
  
  // Step 2: SHA256(hexKey as UTF-8) → 32-byte AES key
  const aesKey = crypto.createHash('sha256')
    .update(hexKey, 'utf8')
    .digest();
  
  // Step 3: vBook app runtime always decrypts using a NULL IV (16 zero bytes).
  // Using a derived MD5 IV corrupts the first 16 bytes, causing runtime crashes.
  const iv = Buffer.alloc(16, 0);
  
  return { aesKey, iv, payload };
}

// ─── Encryption ─────────────────────────────────────────────────────────────

function encryptCode(code, aesKey, iv) {
  try {
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    cipher.setAutoPadding(true);  // PKCS7 auto-padding
    
    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(code, 'utf8'),
      cipher.final()
    ]);
    
    // Encode to Base64
    let b64 = encrypted.toString('base64');
    
    // Token replacement (obfuscate the encryption markers)
    b64 = b64.replace(/\+/g, 'x0P1Xx')
             .replace(/\//g, 'x0P2Xx')
             .replace(/=/g,  'x0P3Xx');
    
    return b64;
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
}

// ─── File Processing ────────────────────────────────────────────────────────

function encryptExtension(extPath) {
  // Read plugin.json
  const pluginJsonPath = path.join(extPath, 'plugin.json');
  if (!fs.existsSync(pluginJsonPath)) {
    throw new Error(`plugin.json not found: ${pluginJsonPath}`);
  }
  
  const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
  const metadata = plugin.metadata || {};
  
  // Generate encryption key
  const { aesKey, iv, payload } = generateEncryptionKey(metadata);
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('ENCRYPT - AES-256-CBC Encryption');
  console.log(`${'='.repeat(70)}`);
  console.log(`\n📋 Payload: ${payload}`);
  console.log(`🔑 AES Key: ${aesKey.toString('hex').slice(0, 16)}...`);
  console.log(`🔓 IV:      ${iv.toString('hex')}`);
  console.log();
  
  // Process bundle files
  const srcDir = path.join(extPath, 'src');
  if (!fs.existsSync(srcDir)) {
    throw new Error(`src/ directory not found: ${srcDir}`);
  }
  
  const bundleFiles = fs.readdirSync(srcDir)
    .filter(f => f.endsWith('.bundle.js'));
  
  if (bundleFiles.length === 0) {
    throw new Error(`No .bundle.js files found. Run obfuscate.js first.`);
  }
  
  let successCount = 0;
  const updates = {};  // Track script updates for plugin.json
  
  for (const file of bundleFiles) {
    const bundlePath = path.join(srcDir, file);
    const encryptedPath = path.join(srcDir, file.replace('.bundle.js', '.encrypted.js'));
    
    try {
      const code = fs.readFileSync(bundlePath, 'utf8');
      const encrypted = encryptCode(code, aesKey, iv);
      
      fs.writeFileSync(encryptedPath, encrypted, 'utf8');
      
      const encryptedSize = encrypted.length;
      console.log(`✅ ${file.padEnd(25)} → ${encryptedSize.toString().padStart(7)} B encrypted`);
      
      // Track for plugin.json update
      const scriptName = file.replace('.bundle.js', '');
      updates[scriptName] = `${scriptName}.encrypted.js`;
      
      successCount++;
    } catch (err) {
      console.log(`❌ ${file.padEnd(25)} ERROR: ${err.message}`);
    }
  }
  
  // Update plugin.json
  if (Object.keys(updates).length > 0) {
    plugin.metadata = plugin.metadata || {};
    plugin.metadata.encrypt = true;
    
    if (plugin.script) {
      for (const [name, path] of Object.entries(updates)) {
        if (plugin.script[name]) {
          plugin.script[name] = path;
        }
      }
    }
    
    fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2), 'utf8');
    console.log(`\n✅ plugin.json updated: encrypt = true, script paths updated`);
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ Result: ${successCount}/${bundleFiles.length} files encrypted`);
  console.log(`📁 Output: ${srcDir}/*.encrypted.js`);
  console.log(`${'='.repeat(70)}\n`);
  
  return successCount === bundleFiles.length;
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
    console.error('Usage: node encrypt.js <extPath>');
    console.error('Example: node encrypt.js extensions/novel/kychi_truyencv');
    process.exit(1);
  }
  
  try {
    const success = encryptExtension(path.resolve(extPath));
    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error(`\n❌ ERROR: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { generateEncryptionKey, encryptCode, encryptExtension };
