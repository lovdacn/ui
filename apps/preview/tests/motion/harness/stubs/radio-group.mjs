/**
 * Minimal `@rn-primitives/radio-group` stub.
 *
 * Mirrors the installed 1.5.2 contract: the Root is CONTROLLED only (`value` +
 * `onValueChange`), which is exactly why the adapter has to derive item selection itself.
 */
import * as React from 'react';

import { Pressable, View } from './react-native.mjs';
import { mergeSlotProps } from './slot.mjs';

const RootContext = React.createContext(null);
const ItemContext = React.createContext(null);

function renderHost(Host, { asChild, children, ...props }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, mergeSlotProps(props, children.props));
  }
  return React.createElement(Host, props, children);
}

export function Root({ asChild, value, onValueChange, disabled = false, children, ...viewProps }) {
  const context = React.useMemo(
    () => ({ value, onValueChange, disabled }),
    [value, onValueChange, disabled]
  );
  return React.createElement(
    RootContext.Provider,
    { value: context },
    renderHost(View, { asChild, children, ...viewProps })
  );
}
Root.displayName = 'RadioGroupRoot';

export function Item({ asChild, value: itemValue, disabled, children, onPress, ...props }) {
  const root = React.useContext(RootContext);
  const handlePress = (event) => {
    onPress?.(event);
    root?.onValueChange?.(itemValue);
  };
  const context = React.useMemo(() => ({ value: itemValue }), [itemValue]);
  return React.createElement(
    ItemContext.Provider,
    { value: context },
    renderHost(Pressable, {
      asChild,
      children,
      onPress: handlePress,
      role: 'radio',
      'aria-checked': root?.value === itemValue,
      disabled: disabled ?? root?.disabled,
      ...props,
    })
  );
}
Item.displayName = 'RadioGroupItem';

export function Indicator({ asChild, forceMount, children, ...props }) {
  const root = React.useContext(RootContext);
  const item = React.useContext(ItemContext);
  if (!forceMount && root?.value !== item?.value) return null;
  return renderHost(View, { asChild, children, ...props });
}
Indicator.displayName = 'RadioGroupIndicator';

export function useRootContext() {
  return React.useContext(RootContext);
}
