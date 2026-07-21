import * as React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SpinnerProps extends React.ComponentPropsWithoutRef<typeof View> {
  size?: 'small' | 'large' | number;
  color?: string;
  nativeOnly?: boolean;
}

function Spinner({ className, size = 'small', color, nativeOnly = false, ref, ...props }: SpinnerProps & { ref?: React.Ref<View> }) {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const iconSize = typeof size === 'number' ? size : size === 'large' ? 36 : 24;

  if (nativeOnly) {
    return (
      <View ref={ref} className={cn('items-center justify-center', className)} {...props}>
        <ActivityIndicator size={typeof size === 'number' ? 'small' : size} color={color} />
      </View>
    );
  }

  return (
    <View ref={ref} className={cn('items-center justify-center', className)} {...props}>
      <Animated.View style={animatedStyle}>
        <Loader2 size={iconSize} color={color} className="text-primary" />
      </Animated.View>
    </View>
  );
}

Spinner.displayName = 'Spinner';

export { Spinner };
export type { SpinnerProps };
