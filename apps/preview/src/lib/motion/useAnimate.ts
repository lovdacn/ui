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
  SlideInUp,
  SlideOutDown,
  SlideOutUp,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { parseAnimateProp } from './parser';
import type { AnimateProp } from './types';

export function useAnimate(prop?: AnimateProp) {
  const parsed = useMemo(() => parseAnimateProp(prop), [prop]);

  const isPressed = useSharedValue(false);
  const isHovered = useSharedValue(false);

  const animateVal = (targetVal: any) => {
    'worklet';
    if (typeof targetVal === 'string') {
      return targetVal;
    }
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
    if (!prop) return {};

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

    if (transforms.length > 0) {
      style.transform = transforms;
    }

    if (activeBase.opacity !== undefined) {
      style.opacity = animateVal(activeBase.opacity);
    }

    return style;
  });

  // Entering layout animation mapping
  let entering;
  if (parsed.enteringName === 'fade-in') {
    entering = FadeIn.duration(parsed.transition.duration || 300);
  } else if (parsed.enteringName === 'slide-up') {
    entering = SlideInDown.duration(parsed.transition.duration || 300);
  } else if (parsed.enteringName === 'slide-down') {
    entering = SlideInUp.duration(parsed.transition.duration || 300);
  } else if (parsed.enteringName === 'zoom-in') {
    entering = ZoomIn.duration(parsed.transition.duration || 300);
  }

  // Exiting layout animation mapping
  let exiting;
  if (parsed.exitingName === 'fade-out') {
    exiting = FadeOut.duration(parsed.transition.duration || 300);
  } else if (parsed.exitingName === 'slide-up') {
    exiting = SlideOutUp.duration(parsed.transition.duration || 300);
  } else if (parsed.exitingName === 'slide-down') {
    exiting = SlideOutDown.duration(parsed.transition.duration || 300);
  } else if (parsed.exitingName === 'zoom-out') {
    exiting = ZoomOut.duration(parsed.transition.duration || 300);
  }

  const handlers = {
    onPressIn: () => {
      'worklet';
      isPressed.value = true;
    },
    onPressOut: () => {
      'worklet';
      isPressed.value = false;
    },
    onPointerEnter: () => {
      'worklet';
      isHovered.value = true;
    },
    onPointerLeave: () => {
      'worklet';
      isHovered.value = false;
    },
  };

  return {
    animatedStyle,
    entering,
    exiting,
    handlers,
    hasAnimation: Boolean(prop),
  };
}
