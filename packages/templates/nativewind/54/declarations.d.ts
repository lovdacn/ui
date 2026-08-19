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

// NOTE: Do not add an augmentation for '@rn-primitives/types'.
//
// SlottableViewProps / SlottablePressableProps / SlottableTextProps are declared
// there as TYPE ALIASES, and a type alias cannot be merged with an `interface`.
// Declaring interfaces of the same name inside `declare module` shadows the real
// aliases instead of extending them, which strips every genuine prop — onPress,
// style, disabled, checked — and produces dozens of misleading errors such as
// "Property 'onPress' does not exist on type ...".
//
// `className` already reaches these components through NativeWind's own
// augmentation (see nativewind-env.d.ts), so nothing needs to be added here.
