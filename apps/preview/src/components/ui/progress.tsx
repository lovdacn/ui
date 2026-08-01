import { cn } from '@/lib/utils';
import * as ProgressPrimitive from '@rn-primitives/progress';
import { View } from '@/components/ui/primitives';
import { Platform } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
}) {
  return (
    <ProgressPrimitive.Root
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}>
      <Indicator value={value} className={indicatorClassName} />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

const Indicator = Platform.select({
  web: WebIndicator,
  native: NativeIndicator,
  default: NullIndicator,
});

type IndicatorProps = {
  value: number | undefined | null;
  className?: string;
};

function WebIndicator({ value, className }: IndicatorProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View
      className={cn('bg-primary h-full w-full flex-1 transition-all', className)}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}>
      <ProgressPrimitive.Indicator className={cn('h-full w-full', className)} />
    </View>
  );
}

function NativeIndicator({ value, className }: IndicatorProps) {
  // The spring is started HERE, in a derived value that re-runs only when `value` changes.
  // `useAnimatedStyle` below just reads it — allocating a new spring inside the style callback
  // would restart the animation on every evaluation.
  const width = useDerivedValue(
    () =>
      withSpring(interpolate(value ?? 0, [0, 100], [1, 100], Extrapolation.CLAMP), {
        overshootClamping: true,
      }),
    [value]
  );

  const indicator = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View style={indicator} className={cn('bg-foreground h-full', className)} />
    </ProgressPrimitive.Indicator>
  );
}

function NullIndicator(_props: IndicatorProps) {
  return null;
}
