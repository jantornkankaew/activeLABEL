import {build} from 'vite';
import ts from 'typescript';
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import path from 'node:path';
const outDir = 'dist-chatgpt';
await build({configFile: false, define: {'process.env.NODE_ENV': JSON.stringify('production')}, build: {outDir, emptyOutDir: true, lib: {entry: 'src/chatgpt-main.tsx', name: 'LabelCraftChatGPT', formats: ['iife'], fileName: () => 'widget.js'}, rollupOptions: {output: {inlineDynamicImports: true}}}});
const files = await readdir(outDir);
const css = (await Promise.all(files.filter(file => file.endsWith('.css')).map(file => readFile(path.join(outDir, file), 'utf8')))).join('\n');
const script = await readFile(path.join(outDir, 'widget.js'), 'utf8');
await writeFile(path.join(outDir, 'widget.html'), `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LabelCraft in ChatGPT</title><style>${css.replace(/<\/style/gi, '<\\/style')}</style></head><body><div id="root"></div><script>${script.replace(/<\/script/gi, '<\\/script')}</script></body></html>`);
await mkdir(path.join(outDir, 'engine'), {recursive: true});
for (const [source, target] of [['src/core.ts', 'core.mjs'], ['src/chatgptEngine.ts', 'engine.mjs']]) {
  const text = await readFile(source, 'utf8');
  const compiled = ts.transpileModule(text, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022}}).outputText.replace("from './core'", "from './core.mjs'");
  await writeFile(path.join(outDir, 'engine', target), compiled);
}
await writeFile(path.join(outDir, 'engine', 'worker.mjs'), await readFile('scripts/chatgpt-worker.mjs', 'utf8'));
console.log('Built self-contained ChatGPT widget and shared validation worker.');
