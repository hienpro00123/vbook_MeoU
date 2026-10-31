#!/usr/bin/env node
/**
 * Vbook Ultimate Unified Decoder Engine V10 (Node.js Port)
 * Usage: node vbook_decoder.js <input.zip> [-o output.zip] [-v]
 *
 * Deps: npm install adm-zip
 */

'use strict';

const crypto  = require('crypto');
const zlib    = require('zlib');
const fs      = require('fs');
const path    = require('path');
const AdmZip  = require('adm-zip');

// ─── helpers ────────────────────────────────────────────────────────────────

/** PKCS7 unpad – throws if padding is invalid */
function pkcs7Unpad(buf) {
  const pad = buf[buf.length - 1];
  if (pad < 1 || pad > 16) throw new Error('bad pad byte');
  for (let i = buf.length - pad; i < buf.length; i++)
    if (buf[i] !== pad) throw new Error('inconsistent padding');
  return buf.slice(0, buf.length - pad);
}

/** Strip leading zeros from hex string (Python str.lstrip('0')) */
function lstrip0(s) { return s.replace(/^0+/, '') || '0'; }

/** 3-way cartesian product */
function* product3(a, b, c) {
  for (const x of a) for (const y of b) for (const z of c) yield [x, y, z];
}

/** MD5 of utf-8 string → hex */
function md5hex(s) { return crypto.createHash('md5').update(s, 'utf8').digest('hex'); }
/** MD5 of utf-8 string → Buffer */
function md5buf(s) { return crypto.createHash('md5').update(s, 'utf8').digest(); }
/** SHA-256 of utf-8 string → Buffer (32 bytes = AES-256 key) */
function sha256(s) { return crypto.createHash('sha256').update(s, 'utf8').digest(); }

// ─── token map ──────────────────────────────────────────────────────────────

const TOKEN_MAP = { x0P1Xx: '+', x0P2Xx: '/', x0P3Xx: '=' };

// ─── key matrix generation ───────────────────────────────────────────────────

/**
 * Returns an array of { aesKey: Buffer(32), md5iv: Buffer(16), label: string }
 * Mirrors Python _generate_aes_keys, deduped by aesKey+md5iv hex string.
 */
function generateKeyMatrix(meta, zipName) {
  const SALTS = [
    'com.vbook.app', 'com.vbook.ext', 'vbook', 'com.stv.app',
    'com.lacatruyen.app', 'com.laca.app', 'lacatruyen', 'laca', '',
  ];

  const rawSrc  = (meta.source  || '').trim();
  const rawName = (meta.name    || '').trim();
  const rawAuth = (meta.author  || '').trim();
  const cleanZip = zipName.replace(/\.zip$/i, '').trim();

  const sources = [...new Set([
    rawSrc, rawSrc + '/', rawSrc.replace(/\/$/, ''),
    rawSrc.replace('https://', 'http://'),
    'https://lacatruyen.store', 'https://lacatruyen.online',
    'https://gemini.google.com', 'https://fanyi.baidu.com',
    'gemini', 'baidu', 'translate', 'chatgpt', 'openai',
    rawName, rawName.toLowerCase(), cleanZip, cleanZip.toLowerCase(),
    'undefined', 'null', '',
  ].filter(s => s !== null && s !== undefined))];

  const authors = [...new Set([
    rawAuth, rawAuth.toLowerCase(), rawAuth.toUpperCase(),
    'QuocBao', 'quocbao', 'QUOCBAO', '3690', 'admin', 'vbook',
    cleanZip, 'undefined', 'null', '',
  ].filter(a => a !== null && a !== undefined))];

  const seen  = new Set();
  const matrix = [];

  for (const [salt, src, auth] of product3(SALTS, sources, authors)) {
    const payload  = `${salt}${src}${auth}`;
    const hexRaw   = md5hex(payload);
    const md5Bytes = md5buf(payload);

    const variants = [
      hexRaw,
      lstrip0(hexRaw),
      hexRaw.toUpperCase(),
      lstrip0(hexRaw).toUpperCase(),
    ];

    for (const hexVar of variants) {
      // Variant A: SHA256(hexVar as utf8) → 32-byte AES key
      const aesKeySha = sha256(hexVar);
      const keyA = aesKeySha.toString('hex') + md5Bytes.toString('hex');
      if (!seen.has(keyA)) {
        seen.add(keyA);
        matrix.push({ aesKey: aesKeySha, md5iv: md5Bytes, label: `[${payload}]` });
      }

      // Variant B: hexVar itself as 32-byte AES key (only when length == 32)
      const hexBuf = Buffer.from(hexVar, 'utf8');
      if (hexBuf.length === 32) {
        const keyB = hexBuf.toString('hex') + md5Bytes.toString('hex');
        if (!seen.has(keyB)) {
          seen.add(keyB);
          matrix.push({ aesKey: hexBuf, md5iv: md5Bytes, label: `[${payload} - HEX]` });
        }
      }
    }
  }

  return matrix;
}

// ─── JS heuristic validator ──────────────────────────────────────────────────

function isValidJS(text) {
  if (!text || text.length < 30) return false;

  const printable = [...text].filter(c => c >= ' ' || c === '\n' || c === '\r' || c === '\t').length;
  if (printable / text.length < 0.85) return false;

  const keywords = ['function', 'var ', 'let ', 'const ', 'load(', 'STV',
                    'Response', 'return', '=[]', '={}', '=>'];
  if (keywords.some(k => text.includes(k))) return true;

  const t = text.trim();
  if ((t.startsWith('[') && t.endsWith(']')) ||
      (t.startsWith('{') && t.endsWith('}'))) return true;

  return false;
}

// ─── smart decompress ────────────────────────────────────────────────────────

function smartDecompress(buf) {
  // 1. Raw UTF-8
  try {
    const text = buf.toString('utf8');
    if (isValidJS(text)) return text;
  } catch {}

  // 2. gzip
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    try {
      const text = zlib.gunzipSync(buf).toString('utf8');
      if (isValidJS(text)) return text;
    } catch {}
  }

  // 3. zlib with magic header 0x789c
  const zlibIdx = buf.indexOf(Buffer.from([0x78, 0x9c]));
  if (zlibIdx !== -1) {
    try {
      const text = zlib.inflateSync(buf.slice(zlibIdx)).toString('utf8');
      if (isValidJS(text)) return text;
    } catch {}
  }

  // 4. raw deflate at various offsets
  const maxOffset = Math.min(buf.length, 64);
  for (let offset = 0; offset < maxOffset; offset++) {
    try {
      const text = zlib.inflateRawSync(buf.slice(offset)).toString('utf8');
      if (isValidJS(text)) return text;
    } catch {}
  }

  return null;
}

// ─── AES decryption ──────────────────────────────────────────────────────────

const NULL_IV = Buffer.alloc(16, 0);

function tryAesDecrypt(aesKey, iv, mode, data) {
  try {
    const algo = mode === 'ecb' ? 'aes-256-ecb' : 'aes-256-cbc';
    const decipher = mode === 'ecb'
      ? crypto.createDecipheriv(algo, aesKey, '')
      : crypto.createDecipheriv(algo, aesKey, iv);

    decipher.setAutoPadding(false);        // we do manual PKCS7
    const raw = Buffer.concat([decipher.update(data), decipher.final()]);

    // try with unpadding
    try {
      const result = smartDecompress(pkcs7Unpad(raw));
      if (result) return result;
    } catch {}

    // try without unpadding
    const result = smartDecompress(raw);
    if (result) return result;
  } catch {}
  return null;
}

// ─── main decrypt pipeline ───────────────────────────────────────────────────

/**
 * Returns { text: string, method: string } | { text: null, method: string }
 */
function decryptPayload(rawStr, keyMatrix) {
  // Already plaintext?
  const head = rawStr.slice(0, 100);
  if (head.includes('load(') || head.includes('var ') || head.includes('function')) {
    return { text: rawStr, method: 'Plain text' };
  }

  // Token replacement
  for (const [tok, rep] of Object.entries(TOKEN_MAP))
    rawStr = rawStr.split(tok).join(rep);

  // URL decode + clean
  rawStr = decodeURIComponent(rawStr).replace(/\s+/g, '');
  let cleanB64 = rawStr.replace(/[^A-Za-z0-9+/=\-_]/g, '')
                       .replace(/-/g, '+').replace(/_/g, '/');

  // Fix bad length
  if (cleanB64.length % 4 === 1) cleanB64 = cleanB64.slice(0, -1);
  cleanB64 += '='.repeat((4 - cleanB64.length % 4) % 4);

  let binData;
  try {
    binData = Buffer.from(cleanB64, 'base64');
  } catch {
    return { text: null, method: 'Base64 decode error' };
  }

  // Pad to block boundary
  if (binData.length % 16 !== 0) {
    const pad = Buffer.alloc(16 - (binData.length % 16), 0);
    binData = Buffer.concat([binData, pad]);
  }

  for (const { aesKey, md5iv, label } of keyMatrix) {
    // CBC-Null
    let r = tryAesDecrypt(aesKey, NULL_IV, 'cbc', binData);
    if (r) return { text: r, method: `${label} | CBC-Null` };

    // CBC-Dynamic (skip first block as IV)
    if (binData.length > 16) {
      r = tryAesDecrypt(aesKey, binData.slice(0, 16), 'cbc', binData.slice(16));
      if (r) return { text: r, method: `${label} | CBC-Dynamic` };
    }

    // ECB-Raw
    r = tryAesDecrypt(aesKey, null, 'ecb', binData);
    if (r) return { text: r, method: `${label} | ECB-Raw` };

    // CBC-MD5
    r = tryAesDecrypt(aesKey, md5iv, 'cbc', binData);
    if (r) return { text: r, method: `${label} | CBC-MD5` };
  }

  return { text: null, method: 'Failed: No matching algorithm' };
}

// ─── zip processing ──────────────────────────────────────────────────────────

function processZip(inputPath, outputPath) {
  const zipName    = path.basename(inputPath);
  const zipStem    = zipName.replace(/\.zip$/i, '');
  const zip        = new AdmZip(inputPath);
  const entries    = zip.getEntries();

  const files = {};
  for (const e of entries) {
    if (!e.isDirectory) files[e.entryName] = e.getData();
  }

  if (Object.keys(files).length === 0) throw new Error('Empty zip file');

  // Parse plugin.json
  const meta       = { source: '', author: '', name: '' };
  let pluginName   = zipStem;

  for (const [filename, buf] of Object.entries(files)) {
    if (filename.endsWith('plugin.json')) {
      try {
        const cfg = JSON.parse(buf.toString('utf8'));
        meta.source = cfg.metadata?.source || '';
        meta.author = cfg.metadata?.author || '';
        meta.name   = cfg.metadata?.name   || '';

        if (meta.name) pluginName = meta.name.replace(/[\\/*?:"<>|]/g, '').trim();

        if (cfg.metadata) cfg.metadata.encrypt = false;
        else cfg.encrypt = false;

        files[filename] = Buffer.from(JSON.stringify(cfg, null, 2), 'utf8');
      } catch {}
      break;
    }
  }

  if (!outputPath) {
    const dir = path.dirname(inputPath);
    outputPath = path.join(dir, `${pluginName}_decoded.zip`);
  }

  const keyMatrix = generateKeyMatrix(meta, zipStem);

  const outZip      = new AdmZip();
  let successCount  = 0;
  let jsCount       = 0;
  let foundKey      = null;

  for (const [filename, buf] of Object.entries(files)) {
    const isJs = filename.endsWith('.js') && !filename.includes('decode');

    if (isJs) {
      jsCount++;
      const rawStr = buf.toString('utf8');
      const { text, method } = decryptPayload(rawStr, keyMatrix);
      const savePath = `src/${path.basename(filename)}`;

      if (text) {
        successCount++;
        if (!foundKey && !method.startsWith('Failed')) foundKey = method;
        outZip.addFile(savePath, Buffer.from(text, 'utf8'));
      } else {
        outZip.addFile(savePath, buf);
      }
    } else {
      if (filename.endsWith('plugin.json') || !filename.endsWith('.zip')) {
        outZip.addFile(filename, buf);
      }
    }
  }

  outZip.writeZip(outputPath);
  return { successCount, jsCount, outputPath, foundKey };
}

// ─── single JS file entry ────────────────────────────────────────────────────

/**
 * Decode một file .js đơn lẻ (không cần zip).
 * meta mặc định rỗng → key matrix vét cạn toàn bộ.
 * outputPath mặc định: <stem>_decoded.js
 */
function processJsFile(inputPath, outputPath) {
  const stem   = path.basename(inputPath, '.js');
  const outPath = outputPath || path.join(path.dirname(inputPath), `${stem}_decoded.js`);

  const rawStr    = fs.readFileSync(inputPath, 'utf8');
  const meta      = { source: '', author: '', name: '' };
  const keyMatrix = generateKeyMatrix(meta, stem);

  const { text, method } = decryptPayload(rawStr, keyMatrix);

  if (text) {
    fs.writeFileSync(outPath, text, 'utf8');
    return { successCount: 1, jsCount: 1, outputPath: outPath, foundKey: method };
  } else {
    return { successCount: 0, jsCount: 1, outputPath: outPath, foundKey: null };
  }
}

// ─── CLI entry ───────────────────────────────────────────────────────────────

function main() {
  const args     = process.argv.slice(2);
  let inputPath  = null;
  let outputPath = null;
  let verbose    = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' || args[i] === '--output') { outputPath = args[++i]; }
    else if (args[i] === '-v' || args[i] === '--verbose') { verbose = true; }
    else if (!inputPath) { inputPath = args[i]; }
  }

  if (!inputPath) {
    console.error('Usage: node vbook_decoder.js <input.zip> [-o output.zip] [-v]');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log(' VBOOK ULTIMATE UNIFIED DECODER V10 (Node.js) '.padStart(60).padEnd(80));
  console.log('='.repeat(80));
  console.log();

  try {
    const ext = path.extname(inputPath).toLowerCase();
    const processor = ext === '.js' ? processJsFile : processZip;
    const { successCount, jsCount, outputPath: out, foundKey } =
      processor(inputPath, outputPath);

    console.log(`[+] Input:   ${inputPath}`);
    console.log(`[+] Output:  ${out}`);
    console.log(`[+] JS files: ${jsCount}`);
    console.log(`[+] Decoded:  ${successCount}/${jsCount}`);
    if (foundKey) console.log(`[+] Key found: ${foundKey}`);
    console.log();

    if (successCount > 0) {
      console.log('✅ SUCCESS: Decoded extension saved to output file');
    } else {
      console.log('⚠️  WARNING: No files could be decoded');
    }
  } catch (err) {
    console.error(`❌ ERROR: ${err.message}`);
    if (verbose) console.error(err.stack);
    process.exit(1);
  }
}

main();