/**
 * Minimal `@rn-primitives/collapsible` stub.
 *
 * Mirrors the installed 1.5.2 contract: the Root accepts `open`, `defaultOpen` and
 * `onOpenChange` and keeps its own internal state when it is uncontrolled — which is why
 * the adapter cannot read the real open state from props alone.
 */
import * as React from 'react';

import { Pressable, View } from './react-native.mjs';
import { mergeSlotProps } from './slot.mjs';

const RootContext = React.createContext(null);

function renderHost(Host, { asChild, children, ...props }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, mergeSlotProps(props, children.props));
  }
  return React.createElement(Host, props, children);
}

export function Root({
  asChild,
  open: openProp,
  defaultOpen,
  onOpenChange: onOpenChangeProp,
  disabled = false,
  children,
  ...viewProps
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const open = openProp === undefined ? internalOpen : openProp;

  const onOpenChange = React.useCallback(
    (next) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChangeProp?.(next);
    },
    [openProp, onOpenChangeProp]
  );

  const context = React.useMemo(() => ({ open, onOpenChange, disabled }), [open, onOpenChange, disabled]);

  return React.createElement(
    RootContext.Provider,
    { value: context },
    renderHost(View, { asChild, children, ...viewProps })
  );
}
Root.displayName = 'CollapsibleRoot';

export function Trigger({ asChild, onPress, disabled, children, ...props }) {
  const root = React.useContext(RootContext);
  const handlePress = (event) => {
    onPress?.(event);
    root?.onOpenChange?.(!root?.open);
  };
  return renderHost(Pressable, {
    asChild,
    children,
    onPress: handlePress,
    role: 'button',
    'aria-expanded': root?.open ?? false,
    disabled: disabled ?? root?.disabled,
    ...props,
  });
}
Trigger.displayName = 'CollapsibleTrigger';

export function Content({ asChild, forceMount, children, ...props }) {
  const root = React.useContext(RootContext);
  if (!forceMount && !root?.open) return null;
  return renderHost(View, { asChild, children, ...props });
}
Content.displayName = 'CollapsibleContent';

export function useRootContext() {
  return React.useContext(RootContext);
}
