// Compile modules in memory for isolated tests; no Next.js server or build output.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = process.cwd();
export function testLoader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(root, file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const require = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      const target = name.startsWith('@/') ? path.join(root, name.slice(2))
        : name.startsWith('.') ? path.resolve(path.dirname(filename), name) : null;
      for (const extension of ['.ts', '.tsx']) if (target && fs.existsSync(`${target}${extension}`)) return load(`${target}${extension}`);
      return createRequire(filename)(name);
    };
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }
    }).outputText;
    new Function('require', 'module', 'exports', source)(require, module, module.exports);
    return module.exports;
  }
  return load;
}
