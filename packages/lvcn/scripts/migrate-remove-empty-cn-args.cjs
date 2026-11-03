'use strict';

/**
 * One-off canonical source cleanup: remove empty `cn()` argument residue.
 *
 * `cva(cn('','','', ... , 'real classes')` is not hand-written code. Each empty
 * slot is one generation pass whose output was written back into canonical
 * source: the builder injected a `cn-*` marker as the leading argument, the
 * inliner resolved a marker it had no recipe for into an empty string, and the
 * result was saved over the source. The counts even differ per engine
 * (nativewind accumulated one more pass than uniwind), which is how the drift
 * is visible.
 *
 * The slots are also harmful, not just noise: a marker resolved in the LEADING
 * argument loses every tailwind-merge conflict to the real base classes that
 * follow it, so the style's radius and typography are silently discarded.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../registry-src');
const TARGETS = ['components/ui/badge.tsx', 'components/ui/button.tsx'];
const ENGINES = ['nativewind', 'uniwind'];

const EMPTY_ARGS = /cva\(\s*cn\(\s*(?:''\s*,\s*)+/g;

let changed = 0;

for (const engine of ENGINES) {
  for (const target of TARGETS) {
    const absolute = path.join(SRC, engine, target);
    if (!fs.existsSync(absolute)) continue;

    const before = fs.readFileSync(absolute, 'utf8');
    const matches = before.match(EMPTY_ARGS) || [];
    if (matches.length === 0) {
      console.log(`  ${engine}/${target}: already clean`);
      continue;
    }

    const after = before.replace(EMPTY_ARGS, 'cva(cn(\n    ');
    fs.writeFileSync(absolute, after, 'utf8');
    changed += matches.length;

    const slots = matches.map((match) => (match.match(/''/g) || []).length);
    console.log(`  ${engine}/${target}: removed ${slots.join(' + ')} empty slot(s)`);
  }
}

console.log(`\ncleaned ${changed} cva(cn(...)) call site(s)`);
