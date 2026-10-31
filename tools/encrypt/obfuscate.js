#!/usr/bin/env node
/**
 * OBFUSCATE.JS - Obfuscate JavaScript Source Files
 * Usage: node obfuscate.js <extPath> [-o output-dir]
 * 
 * Input:  src/*.js (original source)
 * Output: src/*.bundle.js (obfuscated)
 */

'use strict';

const Obfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

function obfuscateFile(inputPath, outputPath) {
  try {
    const code = fs.readFileSync(inputPath, 'utf8');
    
    const obfuscated = Obfuscator.obfuscate(code, {
      compact: true,
      controlFlowFlattening: false,
      identifierNamesGenerator: 'hexadecimal',
      renameProperties: false,
      stringArray: true,
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false
    });
    
    const result = obfuscated.getObfuscatedCode();
    fs.writeFileSync(outputPath, result, 'utf8');
    
    return { success: true, inputSize: code.length, outputSize: result.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function obfuscateExtension(extPath) {
  const srcDir = path.join(extPath, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error(`❌ src/ directory not found: ${srcDir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(srcDir)
    .filter(f => f.endsWith('.js') && !f.endsWith('.bundle.js'));
  
  if (files.length === 0) {
    console.error(`❌ No .js files found in ${srcDir}`);
    process.exit(1);
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('OBFUSCATE - JavaScript Source Code Protection');
  console.log(`${'='.repeat(70)}\n`);
  
  let successCount = 0;
  
  for (const file of files) {
    const inputPath = path.join(srcDir, file);
    const outputPath = path.join(srcDir, file.replace('.js', '.bundle.js'));
    
    const { success, inputSize, outputSize, error } = obfuscateFile(inputPath, outputPath);
    
    if (success) {
      const ratio = ((outputSize / inputSize) * 100).toFixed(1);
      console.log(`✅ ${file.padEnd(20)} ${inputSize.toString().padStart(7)} B → ${outputSize.toString().padStart(7)} B (${ratio}%)`);
      successCount++;
    } else {
      console.log(`❌ ${file.padEnd(20)} ERROR: ${error}`);
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ Result: ${successCount}/${files.length} files obfuscated`);
  console.log(`📁 Output: ${srcDir}/*.bundle.js`);
  console.log(`${'='.repeat(70)}\n`);
  
  return successCount === files.length;
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
    console.error('Usage: node obfuscate.js <extPath>');
    console.error('Example: node obfuscate.js extensions/novel/kychi_truyencv');
    process.exit(1);
  }
  
  const success = obfuscateExtension(path.resolve(extPath));
  process.exit(success ? 0 : 1);
}

module.exports = { obfuscateFile, obfuscateExtension };
