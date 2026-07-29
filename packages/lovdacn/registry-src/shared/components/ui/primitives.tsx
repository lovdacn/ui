/**
 * primitives — host indirection layer for lovdaCN. [PLAIN VARIANT]
 *
 * Components render their hosts from this file instead of importing them from
 * `react-native` directly:
 *
 *   import { Pressable, View, Text, TextInput } from '@/components/ui/primitives';
 *
 * THIS is the plain variant: it accepts the shared animation props so component
 * prop types compile, then **discards** them and renders the raw React Native
 * host. It imports no animation library, so a project that never installs
 * animation ships zero Reanimated.
 *
 * Run `lovdacn add motion` to replace this file with the motion-aware variant.
 * Every component that renders through these hosts then honours `animate` /
 * `activeAnimate` with no changes to the components themselves.
 *
 * The types below are the same shape the motion engine exposes, and they are
 * erased at runtime — they cost nothing.
 */
import {
  Pressable as RNPressable,
  Text as RNText,
  TextInput as RNTextInput,
  View as RNView,
} from 'react-native';

/* -------------------------------------------------------------------------------------------------
 * Shared animation types (runtime-erased)
 * -----------------------------------------------------------------------------------------------*/

export type MotionTarget = {
  opacity?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  rotate?: `${number}deg`;
  rotateX?: `${number}deg`;
  rotateY?: `${number}deg`;
  backgroundColor?: string;
  borderColor?: string;
  color?: string;
  borderRadius?: number;
};

export type MotionTransition =
  | {
      type: 'spring';
      damping?: number;
      stiffness?: number;
      mass?: number;
      overshootClamping?: boolean;
      delay?: number;
    }
  | {
      type: 'timing';
      duration?: number;
      easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
      delay?: number;
    };

export type MotionPresetName =
  | 'fade-in'
  | 'fade-out'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'pop'
  | 'press'
  | 'spin'
  | 'pulse'
  | 'bounce'
  | 'shake'
  | 'wiggle';

export interface AnimateConfig {
  initial?: MotionTarget;
  to?: MotionTarget;
  exit?: MotionTarget;
  transition?: MotionTransition;
  repeat?: number | 'infinite';
  reverse?: boolean;
}

export type ActiveState =
  | 'press'
  | 'hover'
  | 'focus'
  | 'checked'
  | 'selected'
  | 'current'
  | 'open'
  | 'expanded'
  | 'visible'
  | 'loading'
  | 'dragging';

export interface ActiveStateConfig {
  to: MotionTarget;
  transition?: MotionTransition;
}

export interface ActiveAnimateConfig {
  to?: MotionTarget;
  transition?: MotionTransition;
  states?: Partial<Record<ActiveState, ActiveStateConfig>>;
}

/** Preset name, utility string (e.g. 'fade-in slide-up duration-200'), config object, or alse. */
export type MotionUtilityString = string & {};
export type AnimateProp = false | MotionPresetName | MotionUtilityString | AnimateConfig;
export type ActiveAnimateProp =
  | false
  | MotionPresetName
  | MotionUtilityString
  | MotionTarget
  | ActiveAnimateConfig;

export interface SharedAnimationProps {
  /** Idle, mount, exit, or continuous animation. `false` disables it. */
  animate?: AnimateProp;
  /** Motion applied while the component's semantic active state is true. */
  activeAnimate?: ActiveAnimateProp;
  /** Explicit active-state override for components without intrinsic state. */
  motionActive?: boolean;
  /** Defaults to `system`. */
  reduceMotion?: 'system' | 'always' | 'never';
}

/* -------------------------------------------------------------------------------------------------
 * Shared timing tokens
 * -----------------------------------------------------------------------------------------------*/

/**
 * The single vocabulary for animation duration/easing across lovdaCN. Declared here (not
 * imported from the engine) so components have one set of timing tokens even when no
 * animation runtime is installed.
 *
 * These values are mirrored by `@/components/ui/motion` and by the Tailwind `duration-*`
 * classes used on web — keep all three in sync so an animation looks the same whichever
 * system drives it.
 */
export const durations = {
  instant: 0,
  fast: 150,
  base: 200,
  slow: 250,
  slower: 300,
} as const;

export const transitions = {
  /** Quick exits and dismissals. */
  fast: { type: 'timing', duration: durations.fast, easing: 'ease-out' },
  /** Default enter/idle transition. */
  base: { type: 'timing', duration: durations.base, easing: 'ease-out' },
  /** Slower, more deliberate movement (sheets, drawers). */
  slow: { type: 'timing', duration: durations.slow, easing: 'ease-out' },
  /** Crisp interaction feedback — the default for press/active states. */
  springSnappy: { type: 'spring', damping: 18, stiffness: 240, mass: 1 },
  /** Gentle, settling movement. */
  springSoft: { type: 'spring', damping: 20, stiffness: 120, mass: 1 },
  /** Playful overshoot. */
  springBouncy: { type: 'spring', damping: 10, stiffness: 260, mass: 1 },
} satisfies Record<string, MotionTransition>;

/* -------------------------------------------------------------------------------------------------
 * Hosts — accept the animation props, ignore them, render the plain host
 * -----------------------------------------------------------------------------------------------*/

function withoutMotionProps<T extends SharedAnimationProps>(props: T) {
  // Strip so nothing unknown reaches the native/DOM host.
  const { animate, activeAnimate, motionActive, reduceMotion, ...rest } = props;
  return rest;
}

type PlainProps<C> = React.ComponentProps<C> & SharedAnimationProps;

function Pressable(props: PlainProps<typeof RNPressable>) {
  return <RNPressable {...withoutMotionProps(props)} />;
}

function View(props: PlainProps<typeof RNView>) {
  return <RNView {...withoutMotionProps(props)} />;
}

function Text(props: PlainProps<typeof RNText>) {
  return <RNText {...withoutMotionProps(props)} />;
}

function TextInput(props: PlainProps<typeof RNTextInput>) {
  return <RNTextInput {...withoutMotionProps(props)} />;
}

/**
 * Host INSTANCE types, exported under the same names as the components above.
 * TypeScript keeps types and values in separate declaration spaces, so `View` is both
 * the component (value) and the underlying host instance type. That keeps existing
 * component code working unchanged:
 *
 *   React.ComponentProps<typeof View>   → the component's props
 *   React.RefAttributes<View>           → a ref to the real native host
 */
type View = RNView;
type Text = RNText;
type TextInput = RNTextInput;
type Pressable = React.ComponentRef<typeof RNPressable>;

export { Pressable, Text, TextInput, View };
