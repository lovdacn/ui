/**
 * primitives — host indirection layer for lovdaCN. [MOTION-AWARE VARIANT]
 *
 * Installed by `lovdacn add motion`, replacing the plain variant. Because every
 * component renders its host from this file, swapping this one file upgrades the
 * whole library: `animate` / `activeAnimate` now work everywhere, with no changes
 * to the components themselves.
 *
 * Components keep importing exactly the same names:
 *
 *   import { Pressable, View, Text, TextInput } from '@/components/ui/primitives';
 *
 * These hosts are engine-backed (see `@/components/ui/motion`): animations run on
 * the UI thread, user handlers are composed rather than replaced, refs resolve to
 * the underlying host, and system reduced-motion is respected by default.
 *
 * Hosts are intentionally generic — they apply no default animation. Each component
 * owns its own default (e.g. Button passes `activeAnimate ?? 'press'`).
 */

/** Marker: tells the CLI this file is the motion-aware variant so a later plain
 *  install cannot overwrite it. Do not remove. */
export const MOTION_PRIMITIVES = true;

export {
  MotionPressable as Pressable,
  MotionText as Text,
  MotionTextInput as TextInput,
  MotionView as View,
} from '@/components/ui/motion';

export type {
  ActiveAnimateConfig,
  ActiveAnimateProp,
  ActiveState,
  ActiveStateConfig,
  AnimateConfig,
  AnimateProp,
  MotionPresetName,
  MotionTarget,
  MotionTransition,
  SharedAnimationProps,
} from '@/components/ui/motion';
