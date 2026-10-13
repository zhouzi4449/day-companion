import { packager } from '@electron/packager';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync, copyFileSync } from 'node:fs';
const codexSource='node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe';
mkdirSync('node_modules/.cache/codex',{recursive:true});
copyFileSync(codexSource,'node_modules/.cache/codex/codex.exe');
const zipDir = 'node_modules/.cache/electron-verified';
const zipName = 'electron-v44.7.0-win32-x64.zip';
if (existsSync(zipDir + '/' + zipName)) {
  const expected = JSON.parse(readFileSync('node_modules/electron/checksums.json', 'utf8'))[zipName];
  if (createHash('sha256').update(readFileSync(zipDir + '/' + zipName)).digest('hex') !== expected) throw new Error('Electron archive checksum mismatch');
}
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const result = await packager({ dir: '.', name: 'DayCompanion', platform: 'win32', arch: 'x64', out: path.join('dist','releases',version), overwrite: true, asar: true,
  icon: 'assets/icon.ico',
  extraResource: 'node_modules/.cache/codex',
  tmpdir: path.join(os.tmpdir(), 'day-companion-build'),
  // Windows may retain fresh extraction handles briefly before directory rename.
  afterExtract: [async () => { await new Promise(resolve => setTimeout(resolve, 1500)); }],
  electronZipDir: existsSync(zipDir + '/' + zipName) ? zipDir : undefined,
  ignore: [/^\/(AGENTS.md|STATE.md|README.md|reviews.json|\.gitignore|package-lock.json)$/, /^\/dist($|\/)/, /^\/tests($|\/)/, /^\/output($|\/)/, /^\/design($|\/)/, /^\/product($|\/)/, /^\/tasks($|\/)/, /^\/release($|\/)/, /^\/promo($|\/)/, /^\/publish($|\/)/, /^\/.git($|\/)/, /^\/.playwright-cli($|\/)/, /^\/node_modules($|\/)/, /^\/desktop\/(create-icon.cjs|package.mjs|create-shortcut.ps1)$/],
  win32metadata: { ProductName: '日有回声', FileDescription: '日有回声桌面体验版', CompanyName: 'DayCompanion', OriginalFilename: 'DayCompanion.exe' } });
console.log('Windows 桌面目录：' + result.join(', '));
