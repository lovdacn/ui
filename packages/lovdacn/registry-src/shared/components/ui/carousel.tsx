import { Icon } from "@/components/ui/icon";
import { Pressable, View } from "@/components/ui/primitives";
import * as React from "react";
import {
  AccessibilityInfo,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

type CarouselContextProps = {
  carouselRef: React.RefObject<FlatList | null>;
  index: number;
  setIndex: (index: number) => void;
  scrollNext: () => void;
  scrollPrev: () => void;
  canScrollNext: boolean;
  canScrollPrev: boolean;
  itemCount: number;
  setItemCount: (count: number) => void;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context)
    throw new Error("useCarousel must be used within a <Carousel />");
  return context;
}

function useReducedMotionPreference() {
  const [reduceMotion, setReduceMotion] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

interface CarouselProps extends React.ComponentPropsWithoutRef<typeof View> {
  opts?: {
    align?: "start" | "center" | "end";
    loop?: boolean;
  };
}

function Carousel({
  className,
  children,
  opts,
  ref,
  ...props
}: CarouselProps & { ref?: React.Ref<View> }) {
  const carouselRef = React.useRef<FlatList>(null);
  const [index, setIndex] = React.useState(0);
  const [itemCount, setItemCount] = React.useState(0);
  const reduceMotion = useReducedMotionPreference();
  const canScrollPrev = Boolean(itemCount > 1 && (opts?.loop || index > 0));
  const canScrollNext = Boolean(
    itemCount > 1 && (opts?.loop || index < itemCount - 1),
  );

  const scrollTo = React.useCallback(
    (nextIndex: number) => {
      carouselRef.current?.scrollToIndex({
        index: nextIndex,
        animated: !reduceMotion,
      });
      setIndex(nextIndex);
      void AccessibilityInfo.announceForAccessibility(
        `Slide ${nextIndex + 1} of ${itemCount}`,
      );
    },
    [itemCount, reduceMotion],
  );

  const scrollPrev = React.useCallback(() => {
    if (!canScrollPrev) return;
    scrollTo(index === 0 ? itemCount - 1 : index - 1);
  }, [canScrollPrev, index, itemCount, scrollTo]);

  const scrollNext = React.useCallback(() => {
    if (!canScrollNext) return;
    scrollTo(index === itemCount - 1 ? 0 : index + 1);
  }, [canScrollNext, index, itemCount, scrollTo]);

  const value = React.useMemo(
    () => ({
      carouselRef,
      index,
      setIndex,
      scrollNext,
      scrollPrev,
      canScrollNext,
      canScrollPrev,
      itemCount,
      setItemCount,
    }),
    [canScrollNext, canScrollPrev, index, itemCount, scrollNext, scrollPrev],
  );

  return (
    <CarouselContext.Provider value={value}>
      <View
        ref={ref}
        accessibilityLabel="Carousel"
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </View>
    </CarouselContext.Provider>
  );
}

Carousel.displayName = "Carousel";

interface CarouselContentProps<T> extends React.ComponentPropsWithoutRef<
  typeof View
> {
  data: T[];
  renderItem: ({
    item,
    index,
  }: {
    item: T;
    index: number;
  }) => React.ReactElement;
}

function CarouselContent<T>({
  className,
  data,
  renderItem,
  ref,
  ...props
}: CarouselContentProps<T> & { ref?: React.Ref<View> }) {
  const { carouselRef, setIndex, setItemCount } = useCarousel();

  React.useEffect(() => {
    setItemCount(data.length);
  }, [data.length, setItemCount]);

  const handleMomentumScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const layoutWidth = event.nativeEvent.layoutMeasurement.width;
      if (layoutWidth <= 0) return;
      const nextIndex = Math.round(contentOffset / layoutWidth);
      setIndex(nextIndex);
      void AccessibilityInfo.announceForAccessibility(
        `Slide ${nextIndex + 1} of ${data.length}`,
      );
    },
    [data.length, setIndex],
  );

  return (
    <View ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <FlatList
        ref={carouselRef}
        data={data}
        renderItem={renderItem}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        keyExtractor={(_, itemIndex) => itemIndex.toString()}
      />
    </View>
  );
}

CarouselContent.displayName = "CarouselContent";

function CarouselItem({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof View> & { ref?: React.Ref<View> }) {
  return (
    <View
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-full items-center justify-center", className)}
      {...props}
    >
      {children}
    </View>
  );
}

CarouselItem.displayName = "CarouselItem";

function CarouselPrevious({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof Pressable> & {
  ref?: React.Ref<View>;
}) {
  const { scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Pressable
      ref={ref}
      accessibilityLabel="Previous slide"
      accessibilityRole="button"
      disabled={!canScrollPrev}
      onPress={scrollPrev}
      className={cn(
        "bg-background border-border absolute left-4 top-1/2 h-11 min-h-11 w-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm active:opacity-80 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Icon as={ChevronLeft} size={18} className="text-foreground" />
    </Pressable>
  );
}

CarouselPrevious.displayName = "CarouselPrevious";

function CarouselNext({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof Pressable> & {
  ref?: React.Ref<View>;
}) {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <Pressable
      ref={ref}
      accessibilityLabel="Next slide"
      accessibilityRole="button"
      disabled={!canScrollNext}
      onPress={scrollNext}
      className={cn(
        "bg-background border-border absolute right-4 top-1/2 h-11 min-h-11 w-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm active:opacity-80 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Icon as={ChevronRight} size={18} className="text-foreground" />
    </Pressable>
  );
}

CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
};
