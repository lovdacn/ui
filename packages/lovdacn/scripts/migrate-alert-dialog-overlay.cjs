'use strict';

/**
 * Remove press-to-dismiss from AlertDialogOverlay.
 *
 * `AlertDialogPrimitive.Overlay` is View-based, so it has no `onPress`. That is
 * deliberate: an alert dialog asks for an explicit choice and must not dismiss on
 * an outside tap the way a Dialog does. The handler was copied from Dialog, where
 * the overlay IS Pressable-based, and it only ever type-checked because the app's
 * `declarations.d.ts` had flattened the primitive prop types.
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../registry-src');

const HEADER_FROM = `function AlertDialogOverlay({
  className,
  children,
  onPress,
  ...props
}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Overlay>, 'asChild'> & {
  children?: React.ReactNode;
}) {
  const { onOpenChange } = AlertDialogPrimitive.useRootContext();

  function onOverlayPress(event: GestureResponderEvent) {
    onPress?.(event);
    if (event.target === event.currentTarget && !event.isDefaultPrevented()) {
      onOpenChange(false);
    }
  }

  return (`;

const HEADER_TO = `function AlertDialogOverlay({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof AlertDialogPrimitive.Overlay>, 'asChild'> & {
  children?: React.ReactNode;
}) {
  return (`;

const PRESS_FROM = `        {...props}
        onPress={Platform.select({ web: onOverlayPress, native: onPress })}>`;
const PRESS_TO = `        {...props}>`;

let changed = 0;

// Regexes rather than exact strings: these files vary in line endings and in the
// exact indentation prettier settled on per engine.
const HEADER_RE =
  /function AlertDialogOverlay\(\{\s*className,\s*children,\s*onPress,\s*\.\.\.props\s*\}(\s*:\s*Omit<React\.ComponentProps<typeof AlertDialogPrimitive\.Overlay>, 'asChild'> & \{\s*children\?: React\.ReactNode;\s*\}\)\s*\{)\s*const \{ onOpenChange \} = AlertDialogPrimitive\.useRootContext\(\);\s*function onOverlayPress\(event: GestureResponderEvent\) \{[\s\S]*?\n  \}\s*\n\s*return \(/;

const PRESS_RE = /(\{\.\.\.props\})\s*\n\s*onPress=\{Platform\.select\(\{ web: onOverlayPress, native: onPress \}\)\}>/;

for (const engine of ['nativewind', 'uniwind']) {
  const file = path.join(SRC, engine, 'components/ui/alert-dialog.tsx');
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');
  const before = text;

  if (HEADER_RE.test(text)) {
    text = text.replace(
      HEADER_RE,
      (_match, signature) =>
        `function AlertDialogOverlay({\n  className,\n  children,\n  ...props\n}${signature}\n  return (`
    );
  } else {
    console.log(`  ${engine}: header pattern not found`);
  }

  if (PRESS_RE.test(text)) text = text.replace(PRESS_RE, '$1>');
  else console.log(`  ${engine}: onPress prop pattern not found`);

  if (text !== before) {
    fs.writeFileSync(file, text, 'utf8');
    changed += 1;
    console.log(`  ${engine}/alert-dialog.tsx updated`);
  }
}

console.log(`\n${changed} file(s) changed`);
