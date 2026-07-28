/**
 * motion — shared animation engine for lovdaCN. [BETA]
 *
 * Provides the `animate` / `activeAnimate` contract used across lovdaCN UI
 * components, plus standalone `Motion` hosts for user-owned content.
 *
 * Design (see ANIMATIONS_NEW.md):
 * - Object configuration is the canonical v1 API. Utility strings are a later phase.
 * - Animations run on the UI thread. Shared values change ONLY when the resolved
 *   target changes (driven by discrete interaction/semantic state). `useDerivedValue`
 *   starts the `withTiming`/`withSpring`; `useAnimatedStyle` only READS shared values.
 *   We never allocate a new spring/timing inside `useAnimatedStyle` on every frame.
 * - User handlers are composed, not replaced (each user callback fires exactly once).
 * - Refs resolve to the underlying host (via `createAnimatedComponent`).
 * - System reduced-motion is respected by default: motion snaps to its final
 *   accessible value instead of animating.
 *
 * NOTE (beta): this is the Phase 0/1 engine. `Motion` + direct hosts + the object
 * API are implemented. Utility-string parsing and per-component auto-wiring across
 * the whole registry are staged for later phases.
 */
import * as React from 'react';
import {
  Pressable,
  type PressableProps,
  type TextProps,
  TextInput,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type EasingFunction,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/* -------------------------------------------------------------------------------------------------
 * Public types
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
  /** Shorthand target for the component's canonical active state. */
  to?: MotionTarget;
  transition?: MotionTransition;
  /** Optional per-state targets for components with more than one state. */
  states?: Partial<Record<ActiveState, ActiveStateConfig>>;
}

export type AnimateProp = false | MotionPresetName | AnimateConfig;
export type ActiveAnimateProp = false | MotionPresetName | MotionTarget | ActiveAnimateConfig;

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
 * Presets
 * -----------------------------------------------------------------------------------------------*/

type LoopKind = 'spin' | 'pulse' | 'bounce' | 'shake' | 'wiggle';

const SPRING_SNAPPY: MotionTransition = { type: 'spring', damping: 18, stiffness: 240, mass: 1 };
const TIMING_FAST: MotionTransition = { type: 'timing', duration: 180, easing: 'ease-out' };

/**
 * Canonical preset table. `initial`/`to` describe the idle/lifecycle layer,
 * `active` describes the active-state overlay, `loop` marks a continuous animation.
 */
export const motionPresets: Record<
  MotionPresetName,
  {
    initial?: MotionTarget;
    to?: MotionTarget;
    exit?: MotionTarget;
    active?: MotionTarget;
    transition?: MotionTransition;
    loop?: LoopKind;
  }
> = {
  'fade-in': { initial: { opacity: 0 }, to: { opacity: 1 }, transition: { type: 'timing', duration: 200 } },
  'fade-out': { exit: { opacity: 0 }, transition: { type: 'timing', duration: 150 } },
  'slide-up': {
    initial: { opacity: 0, translateY: 12 },
    to: { opacity: 1, translateY: 0 },
    transition: SPRING_SNAPPY,
  },
  'slide-down': {
    initial: { opacity: 0, translateY: -12 },
    to: { opacity: 1, translateY: 0 },
    transition: SPRING_SNAPPY,
  },
  'slide-left': {
    initial: { opacity: 0, translateX: 12 },
    to: { opacity: 1, translateX: 0 },
    transition: SPRING_SNAPPY,
  },
  'slide-right': {
    initial: { opacity: 0, translateX: -12 },
    to: { opacity: 1, translateX: 0 },
    transition: SPRING_SNAPPY,
  },
  'zoom-in': {
    initial: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    transition: SPRING_SNAPPY,
  },
  'zoom-out': { exit: { opacity: 0, scale: 0.9 }, transition: { type: 'timing', duration: 150 } },
  pop: { initial: { scale: 0.8 }, to: { scale: 1 }, transition: { type: 'spring', damping: 12, stiffness: 260 } },
  press: { active: { scale: 0.97 }, transition: SPRING_SNAPPY },
  spin: { loop: 'spin', transition: { type: 'timing', duration: 1000 } },
  pulse: { loop: 'pulse', transition: { type: 'timing', duration: 900 } },
  bounce: { loop: 'bounce', transition: { type: 'timing', duration: 600 } },
  shake: { loop: 'shake', transition: { type: 'timing', duration: 400 } },
  wiggle: { loop: 'wiggle', transition: { type: 'timing', duration: 400 } },
};

/* -------------------------------------------------------------------------------------------------
 * Normalization (JS thread, memoized)
 * -----------------------------------------------------------------------------------------------*/

const TRANSFORM_KEYS = [
  'scale',
  'scaleX',
  'scaleY',
  'translateX',
  'translateY',
  'rotate',
  'rotateX',
  'rotateY',
] as const;

const COLOR_KEYS = ['backgroundColor', 'borderColor', 'color'] as const;

const NUMERIC_DEFAULTS: Record<string, number | string> = {
  opacity: 1,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0,
  rotate: '0deg',
  rotateX: '0deg',
  rotateY: '0deg',
  borderRadius: 0,
};

type Normalized = {
  initial: MotionTarget;
  idle: MotionTarget;
  press?: MotionTarget;
  hover?: MotionTarget;
  focus?: MotionTarget;
  semantic?: MotionTarget;
  dragging?: MotionTarget;
  activeTransition: MotionTransition;
  idleTransition: MotionTransition;
  used: Record<string, boolean>;
  loop?: LoopKind;
  loopTransition: MotionTransition;
};

function presetFor(name: MotionPresetName) {
  return motionPresets[name];
}

function resolveAnimate(animate: AnimateProp | undefined, fallback: AnimateProp | undefined) {
  const value = animate === undefined ? fallback : animate;
  if (value === undefined || value === false) return { config: undefined as AnimateConfig | undefined, loop: undefined as LoopKind | undefined };
  if (typeof value === 'string') {
    const p = presetFor(value);
    return {
      config: { initial: p.initial, to: p.to, exit: p.exit, transition: p.transition } as AnimateConfig,
      loop: p.loop,
    };
  }
  return { config: value, loop: undefined };
}

function resolveActive(activeAnimate: ActiveAnimateProp | undefined, fallback: ActiveAnimateProp | undefined) {
  const value = activeAnimate === undefined ? fallback : activeAnimate;
  if (value === undefined || value === false) return undefined;

  if (typeof value === 'string') {
    const p = presetFor(value);
    return { simple: p.active ?? p.to, transition: p.transition, states: undefined } as {
      simple?: MotionTarget;
      transition?: MotionTransition;
      states?: ActiveAnimateConfig['states'];
    };
  }
  // MotionTarget vs ActiveAnimateConfig: config has `to`/`states`/`transition`.
  const asConfig = value as ActiveAnimateConfig;
  if (asConfig.states || asConfig.to || asConfig.transition) {
    return { simple: asConfig.to, transition: asConfig.transition, states: asConfig.states };
  }
  return { simple: value as MotionTarget, transition: undefined, states: undefined };
}

function markUsed(used: Record<string, boolean>, target?: MotionTarget) {
  if (!target) return;
  for (const key of Object.keys(target)) used[key] = true;
}

function normalize(props: {
  animate?: AnimateProp;
  activeAnimate?: ActiveAnimateProp;
  defaultAnimate?: AnimateProp;
  defaultActiveAnimate?: ActiveAnimateProp;
}): Normalized {
  const used: Record<string, boolean> = {};

  const { config: idleCfg, loop } = resolveAnimate(props.animate, props.defaultAnimate);
  const active = resolveActive(props.activeAnimate, props.defaultActiveAnimate);

  const initial = idleCfg?.initial ?? {};
  const idle = idleCfg?.to ?? {};
  const idleTransition = idleCfg?.transition ?? SPRING_SNAPPY;

  markUsed(used, initial);
  markUsed(used, idle);

  // Per-state targets. A component has a single canonical semantic state, so
  // checked/selected/open/expanded/current/visible/loading all collapse into `semantic`.
  let press: MotionTarget | undefined;
  let hover: MotionTarget | undefined;
  let focus: MotionTarget | undefined;
  let semantic: MotionTarget | undefined;
  let dragging: MotionTarget | undefined;
  let activeTransition: MotionTransition = SPRING_SNAPPY;

  if (active) {
    activeTransition = active.transition ?? SPRING_SNAPPY;
    if (active.simple) semantic = active.simple;
    if (active.states) {
      const s = active.states;
      if (s.press) press = s.press.to;
      if (s.hover) hover = s.hover.to;
      if (s.focus) focus = s.focus.to;
      if (s.dragging) dragging = s.dragging.to;
      const sem = s.checked ?? s.selected ?? s.current ?? s.open ?? s.expanded ?? s.visible ?? s.loading;
      if (sem) semantic = sem.to;
    }
    markUsed(used, press);
    markUsed(used, hover);
    markUsed(used, focus);
    markUsed(used, semantic);
    markUsed(used, dragging);
  }

  // Loops mark their driven property as used.
  if (loop === 'spin' || loop === 'wiggle') used.rotate = true;
  if (loop === 'pulse') used.opacity = true;
  if (loop === 'bounce') used.translateY = true;
  if (loop === 'shake') used.translateX = true;

  const loopTransition = loop ? (idleCfg?.transition ?? motionPresets[loop as MotionPresetName]?.transition ?? TIMING_FAST) : TIMING_FAST;

  return {
    initial,
    idle,
    press,
    hover,
    focus,
    semantic,
    dragging,
    activeTransition,
    idleTransition,
    used,
    loop,
    loopTransition,
  };
}

/* -------------------------------------------------------------------------------------------------
 * useMotion
 * -----------------------------------------------------------------------------------------------*/

export interface UseMotionConfig extends SharedAnimationProps {
  /** When true, interaction/active motion is suppressed (returns to idle). */
  disabled?: boolean;
  /** Component default idle/lifecycle animation. */
  defaultAnimate?: AnimateProp;
  /** Component default active animation (e.g. Button press scale). */
  defaultActiveAnimate?: ActiveAnimateProp;
}

export interface MotionHandlers {
  onPressIn?: (e: unknown) => void;
  onPressOut?: (e: unknown) => void;
  onHoverIn?: (e: unknown) => void;
  onHoverOut?: (e: unknown) => void;
  onFocus?: (e: unknown) => void;
  onBlur?: (e: unknown) => void;
  onPointerCancel?: (e: unknown) => void;
}

function easingFor(name: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'): EasingFunction {
  'worklet';
  switch (name) {
    case 'linear':
      return Easing.linear;
    case 'ease-in':
      return Easing.in(Easing.ease);
    case 'ease-in-out':
      return Easing.inOut(Easing.ease);
    case 'ease-out':
    default:
      return Easing.out(Easing.ease);
  }
}

/**
 * Core hook. Returns an animated style, composed interaction handlers, and
 * shared interaction state for specialized components.
 */
export function useMotion(config: UseMotionConfig) {
  const {
    animate,
    activeAnimate,
    motionActive,
    reduceMotion = 'system',
    disabled = false,
    defaultAnimate,
    defaultActiveAnimate,
  } = config;

  const systemReduced = useReducedMotion();
  const rmActive = reduceMotion === 'always' ? true : reduceMotion === 'never' ? false : systemReduced;

  // JS-thread normalization. Recomputed only when inputs change.
  const n = React.useMemo(
    () => normalize({ animate, activeAnimate, defaultAnimate, defaultActiveAnimate }),
    // Stringify to keep object identity from thrashing the memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(animate), JSON.stringify(activeAnimate), JSON.stringify(defaultAnimate), JSON.stringify(defaultActiveAnimate)]
  );

  // Discrete state as shared values so derived values react reliably.
  const pressed = useSharedValue(false);
  const hovered = useSharedValue(false);
  const focused = useSharedValue(false);
  const dragging = useSharedValue(false);
  const semActive = useSharedValue(!!motionActive);
  const isDisabled = useSharedValue(!!disabled);
  const rm = useSharedValue(rmActive);
  const mounted = useSharedValue(false);
  const loopProgress = useSharedValue(0);

  React.useEffect(() => {
    semActive.value = !!motionActive;
  }, [motionActive, semActive]);
  React.useEffect(() => {
    isDisabled.value = !!disabled;
  }, [disabled, isDisabled]);
  React.useEffect(() => {
    rm.value = rmActive;
  }, [rmActive, rm]);
  React.useEffect(() => {
    mounted.value = true;
  }, [mounted]);

  // Loop lifecycle: start on mount when a loop preset is active + not reduced;
  // cancel on unmount and when reduced motion turns on.
  const loopKind = n.loop;
  const loopDuration =
    n.loopTransition.type === 'timing' ? n.loopTransition.duration ?? 1000 : 1000;
  React.useEffect(() => {
    if (!loopKind || rmActive) {
      cancelAnimation(loopProgress);
      loopProgress.value = 0;
      return;
    }
    loopProgress.value = 0;
    loopProgress.value = withRepeat(
      withTiming(1, { duration: loopDuration, easing: Easing.linear }),
      -1,
      loopKind !== 'spin' // reverse for pulse/bounce/shake/wiggle
    );
    return () => cancelAnimation(loopProgress);
  }, [loopKind, rmActive, loopDuration, loopProgress]);

  // Capture normalized targets as plain, serializable objects for the worklets.
  const initial = n.initial;
  const idle = n.idle;
  const pressT = n.press;
  const hoverT = n.hover;
  const focusT = n.focus;
  const semT = n.semantic;
  const dragT = n.dragging;
  const used = n.used;
  const activeTransition = n.activeTransition;
  const idleTransition = n.idleTransition;

  // Worklet: apply a transition toward a target value, honoring reduced motion.
  const applyTransition = (
    toValue: number | string,
    transition: MotionTransition,
    reduced: boolean
  ): number | string => {
    'worklet';
    if (reduced) return toValue; // snap to final accessible value
    const t = transition as {
      type: 'spring' | 'timing';
      duration?: number;
      easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
      damping?: number;
      stiffness?: number;
      mass?: number;
      overshootClamping?: boolean;
      delay?: number;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let animatedValue: any;
    if (t.type === 'timing') {
      animatedValue = withTiming(toValue as number, {
        duration: t.duration ?? 200,
        easing: easingFor(t.easing ?? 'ease-out'),
      });
    } else {
      animatedValue = withSpring(toValue as number, {
        damping: t.damping ?? 15,
        stiffness: t.stiffness ?? 180,
        mass: t.mass ?? 1,
        overshootClamping: t.overshootClamping ?? false,
      });
    }
    if (t.delay && t.delay > 0) {
      return withDelay(t.delay, animatedValue);
    }
    return animatedValue;
  };

  // Worklet: resolve the current target for a property, following state precedence:
  // disabled -> dragging -> press -> semantic -> focus -> hover -> idle.
  const resolve = (prop: string): number | string => {
    'worklet';
    if (!used[prop]) {
      return NUMERIC_DEFAULTS[prop] ?? 0;
    }

    const idleValue =
      (idle as Record<string, number | string>)[prop] ?? NUMERIC_DEFAULTS[prop] ?? 0;

    // Mount phase: hold the initial value (no animation) until mounted flips true.
    if (!mounted.value) {
      const initValue = (initial as Record<string, number | string>)[prop];
      if (initValue !== undefined) return initValue;
      return idleValue;
    }

    if (isDisabled.value) {
      return applyTransition(idleValue, idleTransition, rm.value);
    }

    // Highest-precedence active state that defines this property wins.
    let target: number | string | undefined;
    if (dragging.value && dragT) target = (dragT as Record<string, number | string>)[prop];
    if (target === undefined && pressed.value && pressT)
      target = (pressT as Record<string, number | string>)[prop];
    if (target === undefined && semActive.value && semT)
      target = (semT as Record<string, number | string>)[prop];
    if (target === undefined && focused.value && focusT)
      target = (focusT as Record<string, number | string>)[prop];
    if (target === undefined && hovered.value && hoverT)
      target = (hoverT as Record<string, number | string>)[prop];

    if (target !== undefined) {
      return applyTransition(target, activeTransition, rm.value);
    }
    return applyTransition(idleValue, idleTransition, rm.value);
  };

  // One derived value per animatable property. Each re-runs ONLY when a discrete
  // state shared value changes — never every frame — and starts the animation.
  const opacity = useDerivedValue(() => resolve('opacity'));
  const scale = useDerivedValue(() => resolve('scale'));
  const scaleX = useDerivedValue(() => resolve('scaleX'));
  const scaleY = useDerivedValue(() => resolve('scaleY'));
  const translateX = useDerivedValue(() => resolve('translateX'));
  const translateY = useDerivedValue(() => resolve('translateY'));
  const rotate = useDerivedValue(() => resolve('rotate'));
  const rotateX = useDerivedValue(() => resolve('rotateX'));
  const rotateY = useDerivedValue(() => resolve('rotateY'));
  const backgroundColor = useDerivedValue(() => resolve('backgroundColor'));
  const borderColor = useDerivedValue(() => resolve('borderColor'));
  const color = useDerivedValue(() => resolve('color'));
  const borderRadius = useDerivedValue(() => resolve('borderRadius'));

  // useAnimatedStyle ONLY reads shared values and assembles the style. Only keys
  // that are actually in use are emitted, so static styles are never clobbered.
  const animatedStyle = useAnimatedStyle(() => {
    const style: Record<string, unknown> = {};
    const transform: Record<string, number | string>[] = [];

    // Loop contribution takes precedence for its own property.
    let loopHandled = '';
    if (loopKind && !rm.value) {
      const p = loopProgress.value;
      if (loopKind === 'spin') {
        transform.push({ rotate: `${p * 360}deg` });
        loopHandled = 'rotate';
      } else if (loopKind === 'pulse') {
        style.opacity = 1 - p * 0.5; // 1 -> 0.5 -> 1 (reverse repeat)
        loopHandled = 'opacity';
      } else if (loopKind === 'bounce') {
        transform.push({ translateY: -p * 8 });
        loopHandled = 'translateY';
      } else if (loopKind === 'shake') {
        transform.push({ translateX: (p - 0.5) * 8 });
        loopHandled = 'translateX';
      } else if (loopKind === 'wiggle') {
        transform.push({ rotate: `${(p - 0.5) * 6}deg` });
        loopHandled = 'rotate';
      }
    }

    if (used.opacity && loopHandled !== 'opacity') style.opacity = opacity.value;
    if (used.translateX && loopHandled !== 'translateX') transform.push({ translateX: translateX.value as number });
    if (used.translateY && loopHandled !== 'translateY') transform.push({ translateY: translateY.value as number });
    if (used.scale) transform.push({ scale: scale.value as number });
    if (used.scaleX) transform.push({ scaleX: scaleX.value as number });
    if (used.scaleY) transform.push({ scaleY: scaleY.value as number });
    if (used.rotate && loopHandled !== 'rotate') transform.push({ rotate: rotate.value as string });
    if (used.rotateX) transform.push({ rotateX: rotateX.value as string });
    if (used.rotateY) transform.push({ rotateY: rotateY.value as string });

    if (transform.length > 0) style.transform = transform;
    if (used.backgroundColor) style.backgroundColor = backgroundColor.value as string;
    if (used.borderColor) style.borderColor = borderColor.value as string;
    if (used.color) style.color = color.value as string;
    if (used.borderRadius) style.borderRadius = borderRadius.value as number;

    return style;
  });

  // Interaction handlers set discrete shared values. Setting `.value` from JS is
  // safe here (these are discrete, not per-frame). Reset on cancel/blur.
  const handlers: MotionHandlers = React.useMemo(
    () => ({
      onPressIn: () => {
        pressed.value = true;
      },
      onPressOut: () => {
        pressed.value = false;
      },
      onHoverIn: () => {
        hovered.value = true;
      },
      onHoverOut: () => {
        hovered.value = false;
      },
      onFocus: () => {
        focused.value = true;
      },
      onBlur: () => {
        focused.value = false;
      },
      onPointerCancel: () => {
        pressed.value = false;
      },
    }),
    [pressed, hovered, focused]
  );

  const setDragging = React.useCallback(
    (value: boolean) => {
      dragging.value = value;
    },
    [dragging]
  );

  return {
    animatedStyle,
    handlers,
    /** Advanced: shared interaction state for specialized components. */
    state: { pressed, hovered, focused, dragging, semActive },
    setDragging,
    /** True when any motion is configured. */
    enabled: Object.keys(n.used).length > 0 || !!n.loop,
  };
}

/* -------------------------------------------------------------------------------------------------
 * Handler composition
 * -----------------------------------------------------------------------------------------------*/

const HANDLER_KEYS = [
  'onPressIn',
  'onPressOut',
  'onHoverIn',
  'onHoverOut',
  'onFocus',
  'onBlur',
  'onPointerCancel',
] as const;

/**
 * Merge user-provided handlers with motion handlers so BOTH run and each user
 * callback fires exactly once. Returns only the handler keys.
 */
export function composeMotionHandlers<T extends Record<string, unknown>>(
  userProps: T,
  motionHandlers: MotionHandlers
): Partial<Record<(typeof HANDLER_KEYS)[number], (e: unknown) => void>> {
  const out: Partial<Record<string, (e: unknown) => void>> = {};
  for (const key of HANDLER_KEYS) {
    const userHandler = userProps[key] as ((e: unknown) => void) | undefined;
    const motionHandler = motionHandlers[key];
    if (userHandler || motionHandler) {
      out[key] = (e: unknown) => {
        userHandler?.(e);
        motionHandler?.(e);
      };
    }
  }
  return out;
}

/**
 * Lightweight interaction-state hook for specialized components that own their
 * animated style but still want the shared press/hover/focus contract.
 */
export function useMotionState() {
  const pressed = useSharedValue(false);
  const hovered = useSharedValue(false);
  const focused = useSharedValue(false);
  const dragging = useSharedValue(false);

  const handlers: MotionHandlers = React.useMemo(
    () => ({
      onPressIn: () => {
        pressed.value = true;
      },
      onPressOut: () => {
        pressed.value = false;
      },
      onHoverIn: () => {
        hovered.value = true;
      },
      onHoverOut: () => {
        hovered.value = false;
      },
      onFocus: () => {
        focused.value = true;
      },
      onBlur: () => {
        focused.value = false;
      },
      onPointerCancel: () => {
        pressed.value = false;
      },
    }),
    [pressed, hovered, focused]
  );

  return { pressed, hovered, focused, dragging, handlers };
}

/* -------------------------------------------------------------------------------------------------
 * Animated hosts
 * -----------------------------------------------------------------------------------------------*/

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type WithMotion<P> = P & SharedAnimationProps;

/** Animated View host. */
export function MotionView({
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  style,
  ...props
}: WithMotion<ViewProps>) {
  const { animatedStyle } = useMotion({ animate, activeAnimate, motionActive, reduceMotion });
  return <Animated.View style={[style, animatedStyle]} {...props} />;
}

/** Animated Pressable host with composed interaction handlers. */
export function MotionPressable({
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  style,
  ref,
  ...props
}: WithMotion<PressableProps> & { ref?: React.Ref<React.ComponentRef<typeof Pressable>> }) {
  const { animatedStyle, handlers } = useMotion({
    animate,
    activeAnimate,
    motionActive,
    reduceMotion,
    disabled: props.disabled ?? undefined,
  });
  const composed = composeMotionHandlers(props as Record<string, unknown>, handlers);
  return (
    <AnimatedPressable
      ref={ref}
      style={[style as object, animatedStyle]}
      {...props}
      {...composed}
    />
  );
}

/** Animated Text host. */
export function MotionText({
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  style,
  ...props
}: WithMotion<TextProps>) {
  const { animatedStyle } = useMotion({ animate, activeAnimate, motionActive, reduceMotion });
  return <Animated.Text style={[style, animatedStyle]} {...props} />;
}

/** Animated TextInput host (canonical active state: focus). */
export function MotionTextInput({
  animate,
  activeAnimate,
  motionActive,
  reduceMotion,
  style,
  ref,
  ...props
}: WithMotion<TextInputProps> & { ref?: React.Ref<React.ComponentRef<typeof TextInput>> }) {
  const { animatedStyle, handlers } = useMotion({ animate, activeAnimate, motionActive, reduceMotion });
  const composed = composeMotionHandlers(props as Record<string, unknown>, handlers);
  return <AnimatedTextInput ref={ref} style={[style, animatedStyle]} {...props} {...composed} />;
}

/**
 * `Motion` — standalone host for user-owned content. Defaults to a View host.
 * On web it renders identically (Reanimated drives the same styles).
 */
export function Motion(props: WithMotion<ViewProps>) {
  return <MotionView {...props} />;
}

// Keep a named marker so the beta status is discoverable at runtime/tooling.
export const MOTION_BETA = true;
