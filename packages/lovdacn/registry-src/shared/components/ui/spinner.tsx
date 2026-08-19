import { Icon } from "@/components/ui/icon";
import * as React from "react";
import { View } from "@/components/ui/primitives";
import { ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SpinnerProps extends React.ComponentPropsWithoutRef<typeof View> {
  size?: "small" | "large" | number;
  color?: string;
  nativeOnly?: boolean;
}

function Spinner({
  className,
  size = "small",
  color,
  nativeOnly = false,
  ref,
  ...props
}: SpinnerProps & { ref?: React.Ref<View> }) {
  const iconSize = typeof size === "number" ? size : size === "large" ? 36 : 24;

  return (
    <View
      ref={ref}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      className={cn("items-center justify-center", className)}
      {...props}
    >
      {nativeOnly ? (
        <ActivityIndicator
          size={typeof size === "number" ? "small" : size}
          color={color}
        />
      ) : (
        <AnimatedSpinnerIcon size={iconSize} color={color} />
      )}
    </View>
  );
}

function AnimatedSpinnerIcon({
  size,
  color,
}: {
  size: number;
  color?: string;
}) {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    cancelAnimation(rotation);
    if (reduceMotion) {
      rotation.value = 0;
      return;
    }

    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(rotation);
      rotation.value = 0;
    };
  }, [reduceMotion, rotation]);

  const animatedStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
    [rotation],
  );

  return (
    <Animated.View style={animatedStyle}>
      <Icon as={Loader2} size={size} color={color} className="text-primary" />
    </Animated.View>
  );
}

Spinner.displayName = "Spinner";

export { Spinner };
export type { SpinnerProps };
