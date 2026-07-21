import * as React from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

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
  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }
  return context;
}

interface CarouselProps extends React.ComponentPropsWithoutRef<typeof View> {
  opts?: {
    align?: 'start' | 'center' | 'end';
    loop?: boolean;
  };
}

function Carousel({ className, children, opts, ref, ...props }: CarouselProps & { ref?: React.Ref<View> }) {
  const carouselRef = React.useRef<FlatList>(null);
  const [index, setIndex] = React.useState(0);
  const [itemCount, setItemCount] = React.useState(0);

  const canScrollPrev = index > 0;
  const canScrollNext = index < itemCount - 1;

  const scrollPrev = React.useCallback(() => {
    if (canScrollPrev) {
      const nextIndex = index - 1;
      carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setIndex(nextIndex);
    }
  }, [index, canScrollPrev]);

  const scrollNext = React.useCallback(() => {
    if (canScrollNext) {
      const nextIndex = index + 1;
      carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setIndex(nextIndex);
    }
  }, [index, canScrollNext]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        index,
        setIndex,
        scrollNext,
        scrollPrev,
        canScrollNext,
        canScrollPrev,
        itemCount,
        setItemCount,
      }}
    >
      <View
        ref={ref}
        className={cn('relative', className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </View>
    </CarouselContext.Provider>
  );
}

Carousel.displayName = 'Carousel';

interface CarouselContentProps extends React.ComponentPropsWithoutRef<typeof View> {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactElement;
}

function CarouselContent({
  className,
  data,
  renderItem,
  ref,
  ...props
}: CarouselContentProps & { ref?: React.Ref<View> }) {
  const { carouselRef, setIndex, setItemCount } = useCarousel();

  React.useEffect(() => {
    setItemCount(data.length);
  }, [data.length, setItemCount]);

  const handleMomentumScrollEnd = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const layoutWidth = event.nativeEvent.layoutMeasurement.width;
    if (layoutWidth > 0) {
      const newIndex = Math.round(contentOffset / layoutWidth);
      setIndex(newIndex);
    }
  }, [setIndex]);

  return (
    <View ref={ref} className={cn('overflow-hidden', className)} {...props}>
      <FlatList
        ref={carouselRef}
        data={data}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        keyExtractor={(_, i) => i.toString()}
      />
    </View>
  );
}

CarouselContent.displayName = 'CarouselContent';

function CarouselItem({ className, children, ref, ...props }: React.ComponentPropsWithoutRef<typeof View> & { ref?: React.Ref<View> }) {
  return (
    <View
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn('min-w-full justify-center items-center', className)}
      {...props}
    >
      {children}
    </View>
  );
}

CarouselItem.displayName = 'CarouselItem';

function CarouselPrevious({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof Pressable> & { ref?: React.Ref<View> }) {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Pressable
      ref={ref}
      disabled={!canScrollPrev}
      onPress={scrollPrev}
      className={cn(
        'absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full items-center justify-center bg-background border border-border shadow-sm active:opacity-80 disabled:opacity-50',
        className
      )}
      {...props}
    >
      <ChevronLeft size={16} className="text-foreground" />
    </Pressable>
  );
}

CarouselPrevious.displayName = 'CarouselPrevious';

function CarouselNext({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof Pressable> & { ref?: React.Ref<View> }) {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <Pressable
      ref={ref}
      disabled={!canScrollNext}
      onPress={scrollNext}
      className={cn(
        'absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full items-center justify-center bg-background border border-border shadow-sm active:opacity-80 disabled:opacity-50',
        className
      )}
      {...props}
    >
      <ChevronRight size={16} className="text-foreground" />
    </Pressable>
  );
}

CarouselNext.displayName = 'CarouselNext';

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
};
