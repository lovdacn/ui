'use strict';

/**
 * One-off canonical source migration.
 *
 * Replaces cross-platform `leading-none` with `leading-tight` and removes the
 * web-only `transition-all` from a native literal. Occurrences already scoped to
 * a `Platform.select({ web: ... })` branch are intentionally left alone.
 *
 * Every replacement is an exact string match and is reported, so a miss is
 * visible instead of silent.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../registry-src');

/** [relative file, from, to] */
const EDITS = [
  // Alert title: zero line height clips descenders at large font scales.
  ['components/ui/alert.tsx', 'font-medium leading-none tracking-tight', 'font-medium leading-tight tracking-tight'],
  // Card title.
  ['components/ui/card.tsx', "'font-semibold leading-none'", "'font-semibold leading-tight'"],
  // Dialog title.
  ['components/ui/dialog.tsx', 'text-lg font-semibold leading-none', 'text-lg font-semibold leading-tight'],
  // Alert dialog title.
  ['components/ui/alert-dialog.tsx', 'text-lg font-semibold leading-none', 'text-lg font-semibold leading-tight'],
  // Text `small` variant.
  ['components/ui/text.tsx', "small: 'text-sm font-medium leading-none'", "small: 'text-sm font-medium leading-tight'"],
  // Tabs trigger label.
  [
    'components/ui/tabs.tsx',
    "'text-foreground dark:text-muted-foreground text-sm font-medium leading-none'",
    "'text-foreground dark:text-muted-foreground text-sm font-medium leading-tight'",
  ],
  // Progress indicator: `transition-all` is a web transition with no native
  // meaning; the native indicator is driven by Reanimated.
  [
    'components/ui/progress.tsx',
    "className={cn('bg-primary h-full w-full transition-all', className)}",
    "className={cn('bg-primary h-full w-full', className)}",
  ],
];

const ENGINES = ['nativewind', 'uniwind'];
const SHARED = 'shared';

let applied = 0;
const misses = [];

function edit(absolute, label, from, to) {
  if (!fs.existsSync(absolute)) return false;
  const before = fs.readFileSync(absolute, 'utf8');
  if (!before.includes(from)) return false;
  const after = before.split(from).join(to);
  fs.writeFileSync(absolute, after, 'utf8');
  const count = before.split(from).length - 1;
  applied += count;
  console.log(`  ${label}: ${count}x  ${from.slice(0, 58)}`);
  return true;
}

for (const [relative, from, to] of EDITS) {
  let hit = false;
  for (const root of [...ENGINES, SHARED]) {
    const absolute = path.join(SRC, root, relative);
    if (edit(absolute, `${root}/${relative}`, from, to)) hit = true;
  }
  if (!hit) misses.push(`${relative}  <-  ${from.slice(0, 70)}`);
}

console.log(`\napplied ${applied} replacement(s)`);
if (misses.length > 0) {
  console.log('\nno match (verify by hand):');
  for (const miss of misses) console.log(`  ${miss}`);
}
