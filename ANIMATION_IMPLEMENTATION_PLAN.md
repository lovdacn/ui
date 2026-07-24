# 🚀 Declarative `animate` Prop System: Comprehensive Implementation Master Plan

> **Target Workspace**: `lovdacn` (`c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn`)  
> **Core Engine**: React Native Reanimated v4 (`react-native-reanimated` 4.5.0) + React Native Gesture Handler (`react-native-gesture-handler`) + `@rn-primitives`  
> **Target Platforms**: iOS, Android, and Expo Web (Universal 60–120 FPS UI Thread Performance)

---

## 📖 Executive Summary & Motivation

### The Problem in Current React Native Ecosystems
1. **Tailwind CSS Animation Classes Do Not Work Natively**: Standard CSS animation classes like `animate-spin`, `animate-bounce`, `transition-all`, `duration-300`, and `hover:...` rely on browser CSS animation engines. In React Native (iOS/Android), NativeWind cannot run these CSS animations natively out-of-the-box.
2. **Current Split-Engine Architecture**: Existing UI components in `lovdacn` rely on a fragmented approach:
   - **Web**: Tailwind CSS keyframes via `Platform.select({ web: 'animate-in fade-in-0 duration-200' })`.
   - **Native**: Hardcoded Reanimated layout primitives (`FadeIn.duration(200)`) inside `<NativeOnlyAnimatedView>`.
   - **Missing Micro-Interactions**: Touch controls (`Button`, `Card`, `Badge`, `Input`, `Switch`) lack spring press feedback, hover states, and smooth gesture elevation on native.
3. **DX Pain Point**: Writing low-level imperative Reanimated hooks (`useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`) inside every component creates massive boilerplate and hinders rapid UI development.

### The Solution: The Declarative `animate` Prop System
Separating **visual layout styling** (`className`) from **motion & state behavior** (`animate`) introduces a clean, ergonomic, and performance-first API:

```tsx
// 1. Concise String Utility Syntax
<Button
  className="bg-primary px-4 py-2 rounded-xl"
  animate="fade-in slide-up duration-300 spring press:scale-95 hover:scale-105"
/>

// 2. Object Syntax (Framer-Motion-style fine-grain declarative control)
<Card
  animate={{
    initial: "opacity-0 scale-90",
    animate: "opacity-100 scale-100",
    exit: "opacity-0 scale-95",
    press: "scale-95 translateY-[-2px]",
    hover: "scale-105",
    transition: { type: "spring", damping: 15, stiffness: 150 }
  }}
/>
```

---

## 🏗️ Core Motion Engine Architecture (`lovdacn/motion`)

The motion engine resides within `packages/lovdacn/src/motion` (or exported via `@lovdacn/motion`).

```
                              ┌─────────────────────────────────────────┐
                              │            <Button animate="...">       │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │          parseAnimateProp()             │
                              │  - Lexes utility tokens & state prefixes│
                              │  - Resolves timing/spring/keyframe spec │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │               useAnimate()              │
                              │  - Shared values: isPressed, isHovered  │
                              │  - Native worklets: withSpring/Timing   │
                              │  - Entering/Exiting Layout Animations   │
                              └────────────────────┬────────────────────┘
                                                   │
                                                   ▼
                              ┌─────────────────────────────────────────┐
                              │          Animated.Pressable / View      │
                              │  - Applied animatedStyle & handlers     │
                              └─────────────────────────────────────────┘
```

---

### 1. Type Definitions (`packages/lovdacn/src/motion/types.ts`)

```typescript
export type AnimateDuration = `duration-${number}` | `duration-[${number}]`;
export type AnimateDelay = `delay-${number}` | `delay-[${number}]`;
export type AnimateEase = 'ease-linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type AnimateSpring = 'spring' | 'spring-soft' | 'spring-snappy' | 'spring-bouncy';
export type AnimateRepeat = 'repeat' | `repeat-${number}` | 'repeat-infinite';

export type AnimatePreset =
  | 'fade-in'
  | 'fade-out'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'spin'
  | 'pulse'
  | 'bounce'
  | 'wiggle'
  | 'shake';

export type AnimateTransformToken =
  | `scale-${number}`
  | `scale-[${number}]`
  | `rotate-${number}`
  | `rotate-[${number}deg]`
  | `translate-x-${number}`
  | `translate-x-[${number}]`
  | `translate-y-${number}`
  | `translate-y-[${number}]`
  | `opacity-${number}`
  | `opacity-[${number}]`;

export type AnimateVariantToken =
  | `press:${AnimateTransformToken}`
  | `hover:${AnimateTransformToken}`
  | `focus:${AnimateTransformToken}`
  | `enter:${AnimatePreset}`
  | `exit:${AnimatePreset}`;

export type AnimateUtilityToken =
  | AnimatePreset
  | AnimateDuration
  | AnimateDelay
  | AnimateEase
  | AnimateSpring
  | AnimateRepeat
  | AnimateTransformToken
  | AnimateVariantToken
  | (string & {});

export type AnimatePropString = AnimateUtilityToken | string;

export interface AnimateTransitionConfig {
  type?: 'spring' | 'timing';
  duration?: number;
  delay?: number;
  easing?: AnimateEase;
  damping?: number;
  stiffness?: number;
  mass?: number;
  repeat?: number | 'infinite';
}

export interface AnimateObjectConfig {
  initial?: string | Record<string, any>;
  animate?: string | Record<string, any>;
  exit?: string | Record<string, any>;
  press?: string | Record<string, any>;
  hover?: string | Record<string, any>;
  focus?: string | Record<string, any>;
  transition?: AnimateTransitionConfig;
}

export type AnimateProp = AnimatePropString | AnimateObjectConfig;
```

---

### 2. Lexer & Utility Parser (`packages/lovdacn/src/motion/parser.ts`)

```typescript
import type { AnimateObjectConfig, AnimateProp, AnimateTransitionConfig } from './types';

export interface ParsedAnimateResult {
  initialStyle: Record<string, any>;
  animateStyle: Record<string, any>;
  pressStyle: Record<string, any>;
  hoverStyle: Record<string, any>;
  enteringName?: string;
  exitingName?: string;
  transition: AnimateTransitionConfig;
  infinitePreset?: 'spin' | 'pulse' | 'bounce';
}

export function parseAnimateProp(prop?: AnimateProp): ParsedAnimateResult {
  if (!prop) {
    return {
      initialStyle: {},
      animateStyle: {},
      pressStyle: {},
      hoverStyle: {},
      transition: { type: 'spring', damping: 15, stiffness: 150 },
    };
  }

  if (typeof prop === 'object') {
    return parseAnimateObject(prop);
  }

  return parseAnimateString(prop);
}

function parseAnimateString(str: string): ParsedAnimateResult {
  const tokens = str.trim().split(/\s+/);
  const initialStyle: Record<string, any> = {};
  const animateStyle: Record<string, any> = {};
  const pressStyle: Record<string, any> = {};
  const hoverStyle: Record<string, any> = {};
  
  let enteringName: string | undefined;
  let exitingName: string | undefined;
  let infinitePreset: 'spin' | 'pulse' | 'bounce' | undefined;
  
  const transition: AnimateTransitionConfig = {
    type: 'spring',
    duration: 300,
    damping: 15,
    stiffness: 150,
  };

  for (const token of tokens) {
    // State Variants
    if (token.startsWith('press:')) {
      applyTransformOrStyle(pressStyle, token.replace('press:', ''));
      continue;
    }
    if (token.startsWith('hover:')) {
      applyTransformOrStyle(hoverStyle, token.replace('hover:', ''));
      continue;
    }
    if (token.startsWith('enter:')) {
      enteringName = token.replace('enter:', '');
      continue;
    }
    if (token.startsWith('exit:')) {
      exitingName = token.replace('exit:', '');
      continue;
    }

    // Physics & Timing Configs
    if (token.startsWith('duration-')) {
      transition.duration = parseValueOrArbitrary(token, 'duration-');
      transition.type = 'timing';
      continue;
    }
    if (token.startsWith('delay-')) {
      transition.delay = parseValueOrArbitrary(token, 'delay-');
      continue;
    }
    if (token === 'spring') {
      transition.type = 'spring';
      transition.damping = 15;
      transition.stiffness = 150;
      continue;
    }
    if (token === 'spring-soft') {
      transition.type = 'spring';
      transition.damping = 20;
      transition.stiffness = 100;
      continue;
    }
    if (token === 'spring-bouncy') {
      transition.type = 'spring';
      transition.damping = 8;
      transition.stiffness = 180;
      continue;
    }
    if (token === 'spring-snappy') {
      transition.type = 'spring';
      transition.damping = 12;
      transition.stiffness = 220;
      continue;
    }

    // Keyframes & Layout Presets
    if (['spin', 'pulse', 'bounce'].includes(token)) {
      infinitePreset = token as any;
      continue;
    }
    if (['fade-in', 'slide-up', 'slide-down', 'zoom-in'].includes(token)) {
      applyPresetStyle(initialStyle, animateStyle, token);
      continue;
    }

    // Direct Transform / Property Tokens
    applyTransformOrStyle(animateStyle, token);
  }

  return {
    initialStyle,
    animateStyle,
    pressStyle,
    hoverStyle,
    enteringName,
    exitingName,
    transition,
    infinitePreset,
  };
}

function applyTransformOrStyle(target: Record<string, any>, token: string) {
  if (token.startsWith('scale-')) {
    target.scale = parseNumericScale(token);
  } else if (token.startsWith('opacity-')) {
    target.opacity = parseNumericOpacity(token);
  } else if (token.startsWith('rotate-')) {
    target.rotate = parseRotation(token);
  } else if (token.startsWith('translate-x-')) {
    target.translateX = parseValueOrArbitrary(token, 'translate-x-');
  } else if (token.startsWith('translate-y-')) {
    target.translateY = parseValueOrArbitrary(token, 'translate-y-');
  }
}

function parseNumericScale(token: string): number {
  if (token.includes('[')) return parseFloat(token.split('[')[1].replace(']', ''));
  return parseInt(token.replace('scale-', ''), 10) / 100;
}

function parseNumericOpacity(token: string): number {
  if (token.includes('[')) return parseFloat(token.split('[')[1].replace(']', ''));
  return parseInt(token.replace('opacity-', ''), 10) / 100;
}

function parseRotation(token: string): string {
  if (token.includes('[')) return token.split('[')[1].replace(']', '');
  return `${token.replace('rotate-', '')}deg`;
}

function parseValueOrArbitrary(token: string, prefix: string): number {
  const rest = token.replace(prefix, '');
  if (rest.startsWith('[') && rest.endsWith(']')) return parseFloat(rest.slice(1, -1));
  return parseFloat(rest) || 0;
}

function applyPresetStyle(initial: Record<string, any>, animate: Record<string, any>, preset: string) {
  switch (preset) {
    case 'fade-in':
      initial.opacity = 0;
      animate.opacity = 1;
      break;
    case 'slide-up':
      initial.translateY = 20;
      animate.translateY = 0;
      break;
    case 'slide-down':
      initial.translateY = -20;
      animate.translateY = 0;
      break;
    case 'zoom-in':
      initial.scale = 0.85;
      initial.opacity = 0;
      animate.scale = 1;
      animate.opacity = 1;
      break;
  }
}

function parseAnimateObject(obj: AnimateObjectConfig): ParsedAnimateResult {
  const initial = typeof obj.initial === 'string' ? parseAnimateString(obj.initial).animateStyle : (obj.initial || {});
  const animate = typeof obj.animate === 'string' ? parseAnimateString(obj.animate).animateStyle : (obj.animate || {});
  const press = typeof obj.press === 'string' ? parseAnimateString(obj.press).pressStyle : (obj.press || {});
  const hover = typeof obj.hover === 'string' ? parseAnimateString(obj.hover).hoverStyle : (obj.hover || {});

  return {
    initialStyle: initial,
    animateStyle: animate,
    pressStyle: press,
    hoverStyle: hover,
    transition: obj.transition || { type: 'spring', damping: 15 },
  };
}
```

---

### 3. Native Reanimated Worklet Hook (`packages/lovdacn/src/motion/useAnimate.ts`)

```typescript
import { useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import { parseAnimateProp } from './parser';
import type { AnimateProp } from './types';

export function useAnimate(prop?: AnimateProp) {
  const parsed = useMemo(() => parseAnimateProp(prop), [prop]);

  const isPressed = useSharedValue(false);
  const isHovered = useSharedValue(false);

  const animateVal = (targetVal: any) => {
    'worklet';
    if (typeof targetVal === 'string') return targetVal;
    
    const { transition } = parsed;
    if (transition.type === 'timing') {
      return withTiming(targetVal, {
        duration: transition.duration || 300,
        easing: Easing.out(Easing.quad),
      });
    }
    return withSpring(targetVal, {
      damping: transition.damping || 15,
      stiffness: transition.stiffness || 150,
      mass: transition.mass || 1,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    const style: Record<string, any> = {};
    const activeBase = { ...parsed.initialStyle, ...parsed.animateStyle };

    if (isPressed.value && Object.keys(parsed.pressStyle).length > 0) {
      Object.assign(activeBase, parsed.pressStyle);
    } else if (isHovered.value && Object.keys(parsed.hoverStyle).length > 0) {
      Object.assign(activeBase, parsed.hoverStyle);
    }

    const transforms: any[] = [];
    if (activeBase.scale !== undefined) transforms.push({ scale: animateVal(activeBase.scale) });
    if (activeBase.rotate !== undefined) transforms.push({ rotate: animateVal(activeBase.rotate) });
    if (activeBase.translateX !== undefined) transforms.push({ translateX: animateVal(activeBase.translateX) });
    if (activeBase.translateY !== undefined) transforms.push({ translateY: animateVal(activeBase.translateY) });

    if (transforms.length > 0) style.transform = transforms;
    if (activeBase.opacity !== undefined) style.opacity = animateVal(activeBase.opacity);

    return style;
  });

  let entering;
  if (parsed.enteringName === 'fade-in') entering = FadeIn.duration(parsed.transition.duration || 300);
  else if (parsed.enteringName === 'slide-up') entering = SlideInDown.duration(parsed.transition.duration || 300);

  let exiting;
  if (parsed.exitingName === 'fade-out') exiting = FadeOut.duration(parsed.transition.duration || 300);
  else if (parsed.exitingName === 'slide-up') exiting = SlideOutUp.duration(parsed.transition.duration || 300);

  const handlers = {
    onPressIn: () => { 'worklet'; isPressed.value = true; },
    onPressOut: () => { 'worklet'; isPressed.value = false; },
    onPointerEnter: () => { 'worklet'; isHovered.value = true; },
    onPointerLeave: () => { 'worklet'; isHovered.value = false; },
  };

  return { animatedStyle, entering, exiting, handlers };
}
```

---

## 📑 Master Component Integration Strategy (All 40+ `lovdacn` Components)

Here is the exact implementation breakdown for every single UI component in `apps/preview/src/components/ui/`:

### Group 1: Interactive & Touch Controls
| Component File | Component Name | Default Behavior | `animate` Utility Support |
| :--- | :--- | :--- | :--- |
| [button.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/button.tsx) | `Button` | Press scale & spring snappy physics | `press:scale-95 spring-snappy` |
| [badge.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/badge.tsx) | `Badge` | Micro-press scale feedback | `press:scale-90 spring-soft` |
| [card.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/card.tsx) | `Card` | Hover lift & press scale down | `hover:translate-y-[-4px] press:scale-[0.99]` |
| [avatar.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/avatar.tsx) | `Avatar` | Clickable avatar scale pop | `press:scale-90 hover:scale-105` |
| [toggle.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/toggle.tsx) | `Toggle` | Press state elastic spring | `press:scale-95 spring-bouncy` |
| [toggle-group.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/toggle-group.tsx) | `ToggleGroup` | Item toggle focus pop | `press:scale-95 spring-snappy` |

---

### Group 2: Overlays, Modals & Floating Popovers
| Component File | Component Name | Default Behavior | `animate` Utility Support |
| :--- | :--- | :--- | :--- |
| [dialog.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/dialog.tsx) | `Dialog` | Backdrop fade & window scale pop | `enter:zoom-in enter:fade-in exit:zoom-out` |
| [alert-dialog.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/alert-dialog.tsx) | `AlertDialog` | Backdrop fade & alert window scale | `enter:zoom-in exit:zoom-out duration-200` |
| [sheet.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/sheet.tsx) | `Sheet` | Directional side slide-in/out | `enter:slide-up exit:slide-down spring-soft` |
| [bottom-sheet.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/bottom-sheet.tsx) | `BottomSheet` | Drag bottom spring slide-up | `enter:slide-up exit:slide-down` |
| [popover.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/popover.tsx) | `Popover` | Anchor dropdown slide & fade | `enter:fade-in enter:slide-down duration-150` |
| [tooltip.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/tooltip.tsx) | `Tooltip` | Hover tooltip fade & scale | `enter:fade-in enter:zoom-in duration-100` |
| [dropdown-menu.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/dropdown-menu.tsx) | `DropdownMenu` | Menu open slide & items spring | `enter:fade-in enter:slide-down duration-150` |
| [context-menu.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/context-menu.tsx) | `ContextMenu` | Right-click/long-press menu pop | `enter:zoom-in duration-150` |
| [menubar.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/menubar.tsx) | `Menubar` | Top menu dropdown expansion | `enter:slide-down duration-150` |
| [hover-card.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/hover-card.tsx) | `HoverCard` | Hover preview card fade | `enter:fade-in duration-200` |

---

### Group 3: Expandable & Collapsible Containers
| Component File | Component Name | Default Behavior | `animate` Utility Support |
| :--- | :--- | :--- | :--- |
| [accordion.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/accordion.tsx) | `Accordion` | Content height spring & chevron rotate | `rotate-180 duration-300 layout` |
| [collapsible.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/collapsible.tsx) | `Collapsible` | Expandable content height spring | `layout duration-300 spring-soft` |
| [sidebar.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/sidebar.tsx) | `Sidebar` | Collapsible drawer slide-left | `enter:slide-left exit:slide-left duration-300` |

---

### Group 4: Form Inputs & Selection Controls
| Component File | Component Name | Default Behavior | `animate` Utility Support |
| :--- | :--- | :--- | :--- |
| [switch.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/switch.tsx) | `Switch` | Thumb translation spring | `translate-x-5 spring-snappy duration-200` |
| [checkbox.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/checkbox.tsx) | `Checkbox` | Checkmark scale & pop | `zoom-in duration-150 spring-bouncy` |
| [radio-group.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/radio-group.tsx) | `RadioGroup` | Selected dot scale pop | `zoom-in duration-150` |
| [select.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/select.tsx) | `Select` | Dropdown panel slide & item highlight | `enter:slide-down exit:fade-out duration-150` |
| [input.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/input.tsx) | `Input` | Focus ring scale & glow pulse | `focus:scale-[1.005] duration-200` |
| [textarea.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/textarea.tsx) | `Textarea` | Focus border scale | `focus:scale-[1.005] duration-200` |
| [input-otp.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/input-otp.tsx) | `InputOTP` | Active cell pulse glow | `pulse scale-105 duration-800` |

---

### Group 5: Feedback, Loaders & Indicators
| Component File | Component Name | Default Behavior | `animate` Utility Support |
| :--- | :--- | :--- | :--- |
| [skeleton.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/skeleton.tsx) | `Skeleton` | Continuous pulse opacity shimmer | `pulse duration-1500 repeat-infinite` |
| [spinner.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/spinner.tsx) | `Spinner` | Continuous 360deg rotation loop | `spin duration-1000 repeat-infinite linear` |
| [progress.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/progress.tsx) | `Progress` | Progress indicator width layout fill | `layout duration-300 ease-out` |
| [sonner.tsx](file:///c:/Users/saima/OneDrive/Desktop/expo-ui/lvcn/apps/preview/src/components/ui/sonner.tsx) | `Sonner` (Toasts) | Toast pop-up slide & exit fade | `enter:slide-up exit:fade-out duration-250` |

---

## ⚡ Performance Verification & Testing Strategy

1. **Native UI Thread Audit**:
   - Verify that all gesture styles (`press:`, `hover:`) run on Reanimated native worklets without JS main thread drops (target: locked **60–120 FPS** on iOS/Android).
2. **Parser Performance Benchmarking**:
   - Token parser `parseAnimateProp` memoized via `useMemo` so string lexing only executes once per prop change.
3. **Cross-Platform Parity Verification**:
   - Run in `apps/preview` (`npx expo start`) and verify identical animation behavior across iOS Simulator, Android Emulator, and Expo Web (`react-native-web`).
