'use strict';

/**
 * Strip the invalid '@rn-primitives/types' augmentation from scaffolded apps.
 *
 * These apps were generated from an older template. The augmentation declares
 * `interface SlottableViewProps` against what upstream declares as a TYPE ALIAS,
 * and an interface cannot merge with a type alias — it shadows it, stripping
 * onPress, style, disabled and checked from every primitive and producing dozens
 * of misleading "Property 'x' does not exist" errors.
 */

const fs = require('fs');
const path = require('path');

const APPS_ROOT = path.join(__dirname, '../../../tests/apps');

const NOTE = `
// NOTE: Do not add an augmentation for '@rn-primitives/types'.
//
// SlottableViewProps / SlottablePressableProps / SlottableTextProps are declared
// there as TYPE ALIASES, and a type alias cannot be merged with an \`interface\`.
// Declaring interfaces of the same name inside \`declare module\` shadows the real
// aliases instead of extending them, which strips every genuine prop — onPress,
// style, disabled, checked — and produces dozens of misleading errors such as
// "Property 'onPress' does not exist on type ...".
//
// \`className\` already reaches these components through the style engine's own
// type support, so nothing needs to be added here.
`;

const AUGMENTATION =
  /\n?declare module '@rn-primitives\/types' \{[\s\S]*?\n\}\s*/;

let changed = 0;

for (const app of fs.existsSync(APPS_ROOT) ? fs.readdirSync(APPS_ROOT) : []) {
  const file = path.join(APPS_ROOT, app, 'declarations.d.ts');
  if (!fs.existsSync(file)) continue;

  let text = fs.readFileSync(file, 'utf8');
  if (!AUGMENTATION.test(text)) {
    console.log(`  ${app}: already clean`);
    continue;
  }

  text = text.replace(AUGMENTATION, '\n');
  // The React import only existed to type the augmentation's `children`.
  text = text.replace(/^import type \* as React from 'react';\n+/, '');
  text = `${text.trimEnd()}\n${NOTE}`;

  fs.writeFileSync(file, text, 'utf8');
  changed += 1;
  console.log(`  ${app}: augmentation removed`);
}

console.log(`\n${changed} app(s) cleaned`);
