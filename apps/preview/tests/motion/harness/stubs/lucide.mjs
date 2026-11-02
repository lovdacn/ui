/**
 * Minimal `lucide-react-native` stub: every icon is a no-op SVG tagged with its name.
 *
 * ES modules need named exports to be declared up front, so every icon imported by
 * `src/components/ui/*` is listed here. Add a name when a component starts using a new icon.
 */
import * as React from 'react';

function makeIcon(name) {
  function Icon() {
    return React.createElement('svg', { 'data-icon': name });
  }
  Icon.displayName = name;
  return Icon;
}

const cache = new Map();

export default new Proxy(
  {},
  {
    get(_target, name) {
      if (typeof name !== 'string') return undefined;
      if (!cache.has(name)) cache.set(name, makeIcon(name));
      return cache.get(name);
    },
  }
);

export const AlertCircle = makeIcon('AlertCircle');
export const ArrowRight = makeIcon('ArrowRight');
export const Bold = makeIcon('Bold');
export const Check = makeIcon('Check');
export const CheckCircle2 = makeIcon('CheckCircle2');
export const ChevronDown = makeIcon('ChevronDown');
export const ChevronDownIcon = makeIcon('ChevronDownIcon');
export const ChevronLeft = makeIcon('ChevronLeft');
export const ChevronRight = makeIcon('ChevronRight');
export const ChevronUp = makeIcon('ChevronUp');
export const ChevronUpIcon = makeIcon('ChevronUpIcon');
export const Info = makeIcon('Info');
export const Loader2 = makeIcon('Loader2');
export const MoreHorizontal = makeIcon('MoreHorizontal');
export const PanelLeft = makeIcon('PanelLeft');
export const X = makeIcon('X');
