// Resolve the native executable installed by the official npm package, including Windows.
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import path from 'node:path';
const globalRoot = process.argv[2];
if (!globalRoot) throw Error('Pass npm root -g as the argument');
const target = {
  'darwin-arm64': ['@openai/codex-darwin-arm64', 'aarch64-apple-darwin'],
  'darwin-x64': ['@openai/codex-darwin-x64', 'x86_64-apple-darwin'],
  'win32-arm64': ['@openai/codex-win32-arm64', 'aarch64-pc-windows-msvc'],
  'win32-x64': ['@openai/codex-win32-x64', 'x86_64-pc-windows-msvc'],
  'linux-x64': ['@openai/codex-linux-x64', 'x86_64-unknown-linux-musl'],
}[`${process.platform}-${process.arch}`];
if (!target) throw Error('Unsupported platform');
const codexRoot = path.join(globalRoot, '@openai', 'codex');
const require = createRequire(path.join(codexRoot, 'package.json'));
let vendorRoot;
try { vendorRoot = path.join(path.dirname(require.resolve(`${target[0]}/package.json`)), 'vendor'); }
catch { vendorRoot = path.join(codexRoot, 'vendor'); }
const name = process.platform === 'win32' ? 'codex.exe' : 'codex';
const candidates = ['bin', 'codex'].map(folder => path.join(vendorRoot, target[1], folder, name));
const binary = candidates.find(candidate => existsSync(candidate));
if (!binary) throw Error('Install the official CLI first: npm install -g @openai/codex@0.162.1');
console.log(binary);
