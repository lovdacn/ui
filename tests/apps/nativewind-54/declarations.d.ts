import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

declare module '*.css' {
  const content: any;
  export default content;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module 'react-native' {
  interface TextInputProps {
    className?: string;
    placeholderClassName?: string;
  }
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
}

// NOTE: Do not add an augmentation for '@rn-primitives/types'.
//
// SlottableViewProps / SlottablePressableProps / SlottableTextProps are declared
// there as TYPE ALIASES, and a type alias cannot be merged with an `interface`.
// Declaring interfaces of the same name inside `declare module` shadows the real
// aliases instead of extending them, which strips every genuine prop — onPress,
// style, disabled, checked — and produces dozens of misleading errors such as
// "Property 'onPress' does not exist on type ...".
//
// `className` already reaches these components through the style engine's own
// type support, so nothing needs to be added here.
