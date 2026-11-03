/** Minimal `lucide-react-native` stub: any named export is a no-op icon component. */
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

export const Check = makeIcon('Check');
export const ChevronDown = makeIcon('ChevronDown');
export const ChevronRight = makeIcon('ChevronRight');
export const ChevronUp = makeIcon('ChevronUp');
export const X = makeIcon('X');
