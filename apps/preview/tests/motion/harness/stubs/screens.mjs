/**
 * Minimal `react-native-screens` stub. The real package loads native view managers at import
 * time, which cannot run under Node. Components only use `FullWindowOverlay` (on iOS).
 */
import * as React from 'react';

export function FullWindowOverlay({ children }) {
  return React.createElement(React.Fragment, null, children);
}
