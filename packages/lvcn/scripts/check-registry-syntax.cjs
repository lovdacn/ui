'use strict';

/**
 * Syntax-check registry sources with the TypeScript parser.
 *
 * These files cannot be type-checked in place: their `@/...` imports only resolve
 * inside a consumer app. Parsing still catches every structural mistake — an
 * unbalanced brace, a malformed JSX attribute, a broken generic — which is what a
 * generator editing source text is most likely to introduce.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const registryChannel = require('./lib/registry-channel.cjs');

const SRC = path.resolve(__dirname, '../registry-src');

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

function parseErrors(label, text) {
  const source = ts.createSourceFile(label, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  // `parseDiagnostics` is internal but is the only place the parser records
  // syntactic errors for a standalone source file.
  return (source.parseDiagnostics || []).map((diagnostic) => {
    const { line, character } = source.getLineAndCharacterOfPosition(diagnostic.start);
    return `  ${line + 1}:${character + 1}  ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`;
  });
}

let failed = 0;
let checked = 0;

for (const file of collect(SRC)) {
  checked += 1;
  const errors = parseErrors(file, fs.readFileSync(file, 'utf8'));
  if (errors.length === 0) continue;
  failed += 1;
  console.log(`\nFAIL canonical ${path.relative(SRC, file)}`);
  for (const error of errors.slice(0, 4)) console.log(error);
}

// The builder edits source as text, so the artifact that actually ships has to be
// parsed too: a slot injection that lands mid-token would otherwise reach users.
const stylesRoot = path.join(registryChannel.registryRoot(), 'styles');
if (fs.existsSync(stylesRoot)) {
  const dirs = (parent) =>
    fs
      .readdirSync(parent)
      .map((name) => path.join(parent, name))
      .filter((entry) => fs.statSync(entry).isDirectory());

  for (const engineDir of dirs(stylesRoot)) {
    for (const styleDir of dirs(engineDir)) {
      for (const entry of fs.readdirSync(styleDir)) {
        if (!entry.endsWith('.json') || entry === 'index.json') continue;
        const item = JSON.parse(fs.readFileSync(path.join(styleDir, entry), 'utf8'));
        for (const file of item.files || []) {
          if (!file.content || !/\.tsx?$/.test(file.path || '')) continue;
          checked += 1;
          const label = `${path.basename(engineDir)}/${path.basename(styleDir)}/${file.path}`;
          const errors = parseErrors(label, file.content);
          if (errors.length === 0) continue;
          failed += 1;
          console.log(`\nFAIL generated ${label}`);
          for (const error of errors.slice(0, 4)) console.log(error);
        }
      }
    }
  }
}

console.log(`\nparsed ${checked} file(s), ${failed} with syntax errors`);
process.exit(failed === 0 ? 0 : 1);
