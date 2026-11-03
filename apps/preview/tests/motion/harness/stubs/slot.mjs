/** Minimal `@rn-primitives/slot` stub: merge props into a single child element. */
import * as React from 'react';

export function mergeSlotProps(slotProps, childProps) {
  const merged = { ...childProps, ...slotProps };
  if (slotProps.className && childProps.className) {
    merged.className = `${childProps.className} ${slotProps.className}`;
  }
  if (slotProps.style || childProps.style) {
    merged.style = [childProps.style, slotProps.style].filter(Boolean);
  }
  for (const key of Object.keys(slotProps)) {
    if (!/^on[A-Z]/.test(key)) continue;
    const slotHandler = slotProps[key];
    const childHandler = childProps[key];
    if (typeof slotHandler === 'function' && typeof childHandler === 'function') {
      merged[key] = (...args) => {
        childHandler(...args);
        slotHandler(...args);
      };
    }
  }
  return merged;
}

function SlotImpl({ children, ...slotProps }) {
  if (!React.isValidElement(children)) return null;
  return React.cloneElement(children, mergeSlotProps(slotProps, children.props));
}

export const Slot = SlotImpl;
export const View = SlotImpl;
export const Text = SlotImpl;
export const Pressable = SlotImpl;
export const Image = SlotImpl;
export default SlotImpl;
